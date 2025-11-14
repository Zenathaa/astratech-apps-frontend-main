"use client";

import { useState, useCallback } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import Toast from "@/components/common/Toast";

const maxLengthRules = {
  jabatanDeskripsi: 100,
};

export default function AddJabatanPage() {
  const [formData, setFormData] = useState({
    jabatanDeskripsi: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.jabatanDeskripsi || !formData.jabatanDeskripsi.trim()) {
      newErrors.jabatanDeskripsi = "Nama jabatan wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      jabatanDeskripsi: "",
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field yang wajib diisi.");
        return;
      }

      setLoading(true);

      try {
        const payload = {
          jabatanDeskripsi: formData.jabatanDeskripsi.trim(),
          jabatanCreatedBy: "user_adminhrd", 
        };

        const data = await fetchData(
          API_LINK + "Jabatan/CreateJabatan",
          payload,
          "POST"
        );

        if (data && (data.message === "SUCCESS" || data.message === "Berhasil")) {
          Toast.success("Data jabatan berhasil ditambahkan.");
          reset();
          router.push("/pages/Page_Master_Jabatan");
        } else {
          Toast.error(data?.message || "Terjadi kesalahan. Silakan coba lagi.");
        }
      } catch (err) {
        console.error("Error saat menyimpan jabatan:", err);
        Toast.error("Data gagal disimpan! " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    },
    [validateForm, formData, router, reset]
  );

  const handleCancel = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Jabatan Baru"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Jabatan", href: "/pages/Page_Master_Jabatan" },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-6">
                <Input
                  label="Nama Jabatan"
                  name="jabatanDeskripsi"
                  id="jabatanDeskripsi"
                  value={formData.jabatanDeskripsi}
                  onChange={handleChange}
                  error={errors.jabatanDeskripsi}
                  maxLength={maxLengthRules.jabatanDeskripsi}
                />
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    classType="secondary"
                    label="Batal"
                    onClick={handleCancel}
                    type="button"
                    isDisabled={loading}
                  />
                  <Button
                    classType="primary"
                    iconName={loading ? "" : "save"}
                    label={loading ? "Menyimpan..." : "Simpan"}
                    type="submit"
                    isDisabled={loading}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainContent>
  );
}
