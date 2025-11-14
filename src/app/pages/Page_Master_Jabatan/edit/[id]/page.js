"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { decryptIdUrl } from "@/lib/encryptor";

export default function EditJabatanPage() {
  const { id: encryptedId } = useParams();
  const router = useRouter();
  const id = decryptIdUrl(encryptedId);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "", 
    jabatanDesc: "",
  });

  const loadDetail = useCallback(async () => {
    if (!id) {
      Toast.error("ID jabatan tidak valid.");
      router.back();
      return;
    }

    try {
      setLoading(true);
      const res = await fetchData(`${API_LINK}Jabatan/GetListJabatan/${id}`, {}, "GET");

      if (!res) {
        Toast.error("Data jabatan tidak ditemukan.");
        router.back();
        return;
      }

      setFormData({
        id: res.id ?? id,
        jabatanDesc: res.jabatanDeskripsi ?? "",
      });
    } catch (err) {
      console.error("loadDetail error:", err);
      Toast.error("Gagal memuat data jabatan.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const payload = {
          Id: formData.id,
          JabatanDeskripsi: formData.jabatanDesc.trim(),
        };

        console.log("Payload:", payload);

        const res = await fetchData(`${API_LINK}Jabatan/EditJabatan`, payload, "PUT");

        if (res?.message?.toUpperCase() === "SUCCESS") {
          Toast.success("Data jabatan berhasil diperbarui!");
          router.push("/pages/Page_Master_Jabatan");
        } else {
          Toast.error(res?.message || "Gagal memperbarui data.");
        }
      } catch (err) {
        console.error("handleSubmit error:", err);
        Toast.error("Terjadi kesalahan saat menyimpan.");
      } finally {
        setLoading(false);
      }
    },
    [formData, router]
  );

  const handleCancel = () => router.back();

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Edit Jabatan"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Jabatan", href: "/pages/Page_Master_Jabatan" },
        { label: "Edit" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-lg-6">
                <Input
                  label="Nama Jabatan"
                  name="jabatanDesc"
                  value={formData.jabatanDesc}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12 d-flex justify-content-end gap-2">
                <Button
                  classType="secondary"
                  label="Batal"
                  type="button"
                  onClick={handleCancel}
                  isDisabled={loading}
                />
                <Button
                  classType="primary"
                  iconName="save"
                  label={loading ? "Menyimpan..." : "Simpan Perubahan"}
                  type="submit"
                  isDisabled={loading || !formData.jabatanDesc.trim()}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainContent>
  );
}
