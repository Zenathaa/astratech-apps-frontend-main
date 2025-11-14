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

export default function EditStrukturPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);
  
  console.log("params:", path);
  console.log("decrypted id:", id);
  
  const [loading, setLoading] = useState(true);
  const [parentList, setParentList] = useState([]);
  const [formData, setFormData] = useState({
    strId: "",
    strDesc: "",
    parentId: "",
    tanggalFrom: "",
    tanggalUntil: "",
    strStatus: "Aktif",
  });

  const loadDetail = useCallback(async () => {
    try {
      console.log("Mengambil data dari GetDataStruktur untuk ID:", id);
      const listRes = await fetchData(`${API_LINK}Struktur/GetDataStruktur`, {}, "GET");
      const list = listRes?.data || listRes?.dataList || [];
      
      console.log("List dari API:", list);
      
      const found = list.find(item => 
        item.strId === id || 
        item.strId === parseInt(id) ||
        item.strId?.toString() === id?.toString()
      );
      
      console.log("Data ditemukan:", found);
      
      if (found) {
        setFormData({
          strId: found.strId || id,
          strDesc: found.strDesc || "",
          parentId: found.parentId || "",
          tanggalFrom: (found.tanggalFrom || "").substring(0, 10),
          tanggalUntil: (found.tanggalUntil || "").substring(0, 10),
          strStatus: found.strStatus || "Aktif",
        });
      } else {
        throw new Error("Data struktur dengan ID " + id + " tidak ditemukan");
      }
    } catch (err) {
      console.error("Error load detail:", err);
      Toast.error("Gagal memuat data struktur: " + err.message);
      router.back();
    }
  }, [id, router]);

  const loadParentList = useCallback(async () => {
    try {
      const res = await fetchData(`${API_LINK}Struktur/GetDataStruktur`, {}, "GET");
      let list = res?.data || res?.dataList || [];
      
      list = list.sort((a, b) => Number(a.strId) - Number(b.strId));
      
      const formatted = [{ Value: "", Text: "-" }, ...list.map((i) => ({
        Value: i.strId,
        Text: i.strDesc,
      }))];
      setParentList(formatted);
    } catch (err) {
      Toast.error("Gagal memuat data struktur induk");
    }
  }, []);

  useEffect(() => {
    Promise.all([loadParentList(), loadDetail()]).finally(() => setLoading(false));
  }, [loadParentList, loadDetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.strId) {
      Toast.error("Data struktur belum dimuat. Silakan tunggu sebentar.");
      return;
    }
    
    if (!formData.strDesc.trim()) {
      Toast.error("Nama struktur tidak boleh kosong.");
      return;
    }
    
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        StrId: formData.strId,
        NamaStruktur: formData.strDesc.trim(),
        ParentId: formData.parentId || "",
        TanggalFrom: formData.tanggalFrom || "",
        TanggalUntil: formData.tanggalUntil || "",
        StrStatus: formData.strStatus,
      }).toString();

      const url = `${API_LINK}Struktur/EditStruktur?${queryParams}`;
      console.log("URL dikirim:", url);
      console.log("Data yang dikirim:", {
        StrId: formData.strId,
        NamaStruktur: formData.strDesc.trim(),
        ParentId: formData.parentId || "",
        TanggalFrom: formData.tanggalFrom || "",
        TanggalUntil: formData.tanggalUntil || "",
        StrStatus: formData.strStatus,
      });

      const data = await fetchData(url, {}, "PUT"); 
      
      console.log("Response dari server:", data);

      if (data?.message === "SUCCESS" || data?.message === "Berhasil" || data?.message?.toLowerCase().includes("success")) {
        Toast.success("Data struktur berhasil diperbarui.");
        router.push("/pages/Page_Master_Struktur");
      } else {
        Toast.error(data?.message || "Gagal memperbarui struktur.");
      }
    } catch (err) {
      console.error("Error saat submit:", err);
      Toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const handleCancel = () => router.push("/pages/Page_Master_Struktur");

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Edit Struktur Organisasi"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Struktur Organisasi", href: "/pages/Page_Master_Struktur" },
        { label: "Edit" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-lg-6">
                <Input
                  label="Nama Struktur"
                  name="strDesc"
                  id="strDesc"
                  value={formData.strDesc}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <DropDown
                  label="Parent Struktur"
                  name="parentId"
                  id="parentId"
                  arrData={parentList}
                  value={formData.parentId}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  type="date"
                  label="Tanggal From"
                  name="tanggalFrom"
                  id="tanggalFrom"
                  value={formData.tanggalFrom}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  type="date"
                  label="Tanggal Until"
                  name="tanggalUntil"
                  id="tanggalUntil"
                  value={formData.tanggalUntil}
                  onChange={handleChange}
                />
              </div>

              <div className="col-lg-6">
                <DropDown
                  label="Status Struktur"
                  name="strStatus"
                  id="strStatus"
                  arrData={[
                    { Value: "Aktif", Text: "Aktif" },
                    { Value: "Tidak Aktif", Text: "Tidak Aktif" },
                  ]}
                  value={formData.strStatus}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12 d-flex justify-content-end gap-2">
                <Button
                  classType="secondary"
                  label="Batal"
                  onClick={handleCancel}
                  type="button"
                  isDisabled={loading}
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