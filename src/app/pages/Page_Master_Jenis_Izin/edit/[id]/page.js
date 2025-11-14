"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import DropDown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { decryptIdUrl } from "@/lib/encryptor";

export default function EditJenisIzinPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    idJenisIzin: "",
    jeiNama: "",
    jeiDesc: "",
    jeiJumlahIjinDay: 0,
    jeiJumlahPlusDay: 0,
    jeiValidFrom: "",
    jeiValidUntil: "",
  });

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetchData(
        `${API_LINK}JenisCuti/GetDataJenisCutiById/${id}`,
        {},
        "GET"
      );

      if (!res) {
        Toast.error("Data tidak ditemukan.");
        router.back();
        return;
      }

      setFormData({
        idJenisIzin: res.jeiId,
        jeiNama: res.jeiNama,
        jeiDesc: res.jeiDesc,
        jeiJumlahIjinDay: res.jeiJumlahIjinDay,
        jeiJumlahPlusDay: res.jeiJumlahPlusDay,
        jeiValidFrom: res.jeiValidFrom?.substring(0, 10),
        jeiValidUntil: res.jeiValidUntil?.substring(0, 10),
      });
    } catch (err) {
      Toast.error("Gagal memuat data jenis izin.");
      router.back();
    }
  }, [id, router]);

  useEffect(() => {
    loadDetail().finally(() => setLoading(false));
  }, [loadDetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const payload = {
          jeiId: formData.idJenisIzin,
          jeiNama: formData.jeiNama.trim(),
          jeiDesc: formData.jeiDesc,
          jeiJumlahIjinDay: Number(formData.jeiJumlahIjinDay),
          jeiJumlahPlusDay: Number(formData.jeiJumlahPlusDay),
          jeiValidFrom: formData.jeiValidFrom,
          jeiValidUntil: formData.jeiValidUntil,
        };

        console.log("Payload:", payload);

        const res = await fetchData(
          `${API_LINK}JenisCuti/UpdateJenisCuti`,
          payload,
          "PUT"
        );

        if (res?.message === "SUCCESS") {
          Toast.success("Data berhasil diperbarui!");
          router.push("/pages/Page_Master_Jenis_Izin");
        } else {
          Toast.error(res?.message || "Gagal memperbarui data.");
        }
      } catch (err) {
        Toast.error("Terjadi kesalahan: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [formData, router]
  );

  const handleCancel = () => router.push("/pages/Page_Master_Jenis_Izin");

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Edit Jenis Izin"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Jenis Izin", href: "/pages/Page_Master_JenisIzin" },
        { label: "Edit" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-lg-6">
                <Input
                  label="Nama Jenis Izin"
                  name="jeiNama"
                  value={formData.jeiNama}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label="Keterangan"
                  name="jeiDesc"
                  value={formData.jeiDesc}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  type="number"
                  label="Jumlah Izin (hari)"
                  name="jeiJumlahIjinDay"
                  value={formData.jeiJumlahIjinDay}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  type="number"
                  label="Jumlah Tambahan (hari)"
                  name="jeiJumlahPlusDay"
                  value={formData.jeiJumlahPlusDay}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  type="date"
                  label="Berlaku Dari"
                  name="jeiValidFrom"
                  value={formData.jeiValidFrom}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  type="date"
                  label="Berlaku Sampai"
                  name="jeiValidUntil"
                  value={formData.jeiValidUntil}
                  onChange={handleChange}
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
                />
                <Button
                  classType="primary"
                  iconName="save"
                  label={loading ? "Menyimpan..." : "Simpan Perubahan"}
                  type="submit"
                  isDisabled={loading}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainContent>
  );
}
