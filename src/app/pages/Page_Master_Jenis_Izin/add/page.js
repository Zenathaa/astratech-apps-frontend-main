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
  jeiNama: 100,
  jeiDesc: 200,
};

export default function AddJenisIzinPage() {
  const [formData, setFormData] = useState({
    jeiNama: "",
    jeiDesc: "",
    jeiJumlahIjinDay: "",
    jeiJumlahPlusDay: "",
    jeiValidFrom: "",
    jeiValidUntil: "",
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

    if (!formData.jeiNama.trim()) newErrors.jeiNama = "Nama izin wajib diisi.";
    if (!formData.jeiDesc.trim()) newErrors.jeiDesc = "Deskripsi wajib diisi.";
    if (!formData.jeiJumlahIjinDay) newErrors.jeiJumlahIjinDay = "Jumlah hari izin wajib.";
    if (!formData.jeiJumlahPlusDay) newErrors.jeiJumlahPlusDay = "Plus day wajib.";
    if (!formData.jeiValidFrom) newErrors.jeiValidFrom = "Tanggal mulai wajib.";
    if (!formData.jeiValidUntil) newErrors.jeiValidUntil = "Tanggal akhir wajib.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      jeiNama: "",
      jeiDesc: "",
      jeiJumlahIjinDay: "",
      jeiJumlahPlusDay: "",
      jeiValidFrom: "",
      jeiValidUntil: "",
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi field yang wajib diisi.");
        return;
      }

      setLoading(true);

      try {
        const payload = {
          jeiNama: formData.jeiNama.trim(),
          jeiDesc: formData.jeiDesc.trim(),
          jeiJumlahIjinDay: Number(formData.jeiJumlahIjinDay),
          jeiJumlahPlusDay: Number(formData.jeiJumlahPlusDay),
          jeiValidFrom: formData.jeiValidFrom,
          jeiValidUntil: formData.jeiValidUntil,
        };

        const data = await fetchData(
          API_LINK + "JenisCuti/CreateJenisCuti",
          payload,
          "POST"
        );

        if (data && data.message === "SUCCESS") {
          Toast.success("Jenis izin berhasil ditambahkan.");
          reset();
          router.push("/pages/Page_Master_Jenis_Izin");
        } else {
          Toast.error(data?.message || "Terjadi kesalahan. Silakan coba lagi.");
        }
      } catch (err) {
        console.error("Error:", err);
        Toast.error("Data gagal disimpan! " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    },
    [formData, validateForm, reset, router]
  );

  const handleCancel = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Jenis Izin"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Jenis Izin", href: "/pages/Page_Master_Jenis_Izin" },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-6">
                <Input
                  label="Nama Jenis Izin"
                  name="jeiNama"
                  value={formData.jeiNama}
                  onChange={handleChange}
                  error={errors.jeiNama}
                  maxLength={maxLengthRules.jeiNama}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label="Deskripsi"
                  name="jeiDesc"
                  value={formData.jeiDesc}
                  onChange={handleChange}
                  error={errors.jeiDesc}
                  maxLength={maxLengthRules.jeiDesc}
                />
              </div>

              <div className="col-lg-4 mt-3">
                <Input
                  type="number"
                  label="Jumlah Izin (Hari)"
                  name="jeiJumlahIjinDay"
                  value={formData.jeiJumlahIjinDay}
                  onChange={handleChange}
                  error={errors.jeiJumlahIjinDay}
                />
              </div>

              <div className="col-lg-4 mt-3">
                <Input
                  type="number"
                  label="Plus Day"
                  name="jeiJumlahPlusDay"
                  value={formData.jeiJumlahPlusDay}
                  onChange={handleChange}
                  error={errors.jeiJumlahPlusDay}
                />
              </div>

              <div className="col-lg-4 mt-3">
                <Input
                  type="date"
                  label="Valid From"
                  name="jeiValidFrom"
                  value={formData.jeiValidFrom}
                  onChange={handleChange}
                  error={errors.jeiValidFrom}
                />
              </div>

              <div className="col-lg-4 mt-3">
                <Input
                  type="date"
                  label="Valid Until"
                  name="jeiValidUntil"
                  value={formData.jeiValidUntil}
                  onChange={handleChange}
                  error={errors.jeiValidUntil}
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
