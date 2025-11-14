"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// Layout & Components
import MainContent from "@/components/layout/MainContent";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import SweetAlert from "@/components/common/SweetAlert";
import Table from "@/components/common/Table";

// Libs
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import DateFormatter from "@/lib/dateFormater";

// User Data
import { getSSOData, getUserData } from "@/context/user";

export default function DetailGolonganPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Permission
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  // Ambil data user
  useEffect(() => {
    setIsClient(true);
    setSsoData(getSSOData());
    setUserData(getUserData());
  }, []);

  // Load data tabel
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchData(
        `${API_LINK}detailGolongan/GetDataDetailGolongan?GolonganId=${id}`,
        {},
        "GET"
      );

      setData(res.data || []);
    } catch (err) {
      Toast.error("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (ssoData && userData) {
      loadData();
    }
  }, [ssoData, userData, loadData]);

  // Edit
  const handleEdit = useCallback(
    (benId) => {
      router.push(
        `/pages/Page_Master_DetailGolongan/edit?benId=${encryptIdUrl(
          benId
        )}&golId=${encryptIdUrl(id)}`
      );
    },
    [router, id]
  );

  const handleToggleStatus = useCallback(
    (benId) => {
      // 1. KEMBALIKAN LOGIKA LAMA: Cari data dan hitung status baru
      const item = data.find((d) => d.benId === benId); 
      if (!item) {
        Toast.error("Data benefit tidak ditemukan.");
        return;
      }
      const currentStatus = item.benStatus; 
      const newStatus = currentStatus === "Aktif" ? "Tidak Aktif" : "Aktif";

      SweetAlert({
        title: "Ubah Status",
        text: `Ubah status menjadi "${newStatus}"?`, // Tampilkan status baru
        icon: "warning",
        confirmText: "Ya",
      }).then(async (ok) => {
        if (ok) {
          try {
            // PERBAIKAN: Panggil endpoint [HttpPost("SetStatus")]
            await fetchData(
              `${API_LINK}detailGolongan/SetStatus`, // <-- Rute DTO
              { benId: benId, newStatus: newStatus }, // <-- Kirim DTO di body
              "POST" 
            );

            Toast.success("Status berhasil diperbarui.");
            loadData();
          } catch (err) {
            Toast.error("Gagal mengubah status.");
          }
        }
      });
    },
    [data, loadData] // <-- KEMBALIKAN 'data' ke dependensi
  );

  // Navigasi
  const handleBack = () => router.push("/pages/Page_Master_Golongan");

  const handleTambah = () =>
    router.push(
      `/pages/Page_Master_DetailGolongan/add?golonganId=${encryptIdUrl(id)}`
    );

  // --- DATA TABEL UNTUK COMPONENT TABLE ---
  const tableData = data.map((item, index) => {
    const allowToggle =
      isClient && userData?.permission?.includes("master_golongan.edit");

    return {
      Key: item.benId,
      id: item.benId,

      No: index + 1,
      "Plafon Obat": `Rp ${item.benPlafonObat?.toLocaleString("id-ID") ?? "-"}`,
      "Plafon Lensa Mono": `Rp ${
        item.benPlafonLensaMono?.toLocaleString("id-ID") ?? "-"
      }`,
      "Plafon Lensa Bi": `Rp ${
        item.benPlafonLensaBi?.toLocaleString("id-ID") ?? "-"
      }`,
      "Plafon Rangka": `Rp ${
        item.benPlafonRangka?.toLocaleString("id-ID") ?? "-"
      }`,
      "Status Nikah": item.benStatusPernikahan ?? "-",
      "Tanggal Valid": DateFormatter.formatDate(item.benValidDateFrom),
      "Tanggal Sampai": DateFormatter.formatDate(item.benValidDateUntil),

      // Wajib: status untuk badge & toggle
      Status: item.benStatus,
      benStatus: item.benStatus,

      // Aksi
      Aksi: allowToggle ? ["Edit", "Toggle"] : ["Edit"],

      // Alignment (jumlah harus sesuai kolom)
      Alignment: [
        "center", // no
        "center", // plafon obat
        "center", // mono
        "center", // bi
        "center", // rangka
        "center", // nikah
        "center", // valid
        "center", // sampai
        "center", // status
        "center", // aksi
      ],
    };
  });

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Detail Benefit Golongan"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Golongan", href: "/pages/Page_Master_Golongan" },
        { label: "Detail Benefit" },
      ]}
    >
      <div className="mb-3">
        <Button
          classType="primary"
          iconName="plus"
          label="Tambah Data Benefit"
          onClick={handleTambah}
        />
      </div>

      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <Table
            data={tableData}
            onEdit={handleEdit}
            onToggle={handleToggleStatus}
          />
        </div>

        <div className="card-footer bg-white p-4">
          <div className="d-flex justify-content-end">
            <Button classType="secondary" label="Kembali" onClick={handleBack} />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
