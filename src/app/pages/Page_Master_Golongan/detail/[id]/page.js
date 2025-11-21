"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import MainContent from "@/components/layout/MainContent";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import SweetAlert from "@/components/common/SweetAlert";
import Table from "@/components/common/Table";

import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import DateFormatter from "@/lib/dateFormater";

import { getSSOData, getUserData } from "@/context/user";

export default function DetailGolonganPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  const [golonganInfo, setGolonganInfo] = useState(null);

  useEffect(() => {
    setIsClient(true);
    setSsoData(getSSOData());
    setUserData(getUserData());
  }, []);

  const loadHeader = useCallback(async () => {
    try {
      const url = `${API_LINK}Golongan/GetListGolongan/${id}`;
      const res = await fetchData(url, {}, "GET");

      setGolonganInfo(res);
    } catch (err) {
      Toast.error("Gagal memuat info golongan.");
    }
  }, [id]);

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
      loadHeader();
    }
  }, [ssoData, userData, loadData]);

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
      const item = data.find((d) => d.benId === benId);
      if (!item) {
        Toast.error("Data benefit tidak ditemukan.");
        return;
      }
      const currentStatus = item.benStatus;
      const newStatus = currentStatus === "Aktif" ? "Tidak Aktif" : "Aktif";

      SweetAlert({
        title: "Ubah Status",
        text: `Ubah status menjadi "${newStatus}"?`,
        icon: "warning",
        confirmText: "Ya",
      }).then(async (ok) => {
        if (ok) {
          try {
            await fetchData(
              `${API_LINK}detailGolongan/SetStatus`,
              { benId: benId, newStatus: newStatus },
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
    [data, loadData]
  );

  const handleBack = () => router.push("/pages/Page_Master_Golongan");

  const handleTambah = () =>
    router.push(
      `/pages/Page_Master_DetailGolongan/add?golonganId=${encryptIdUrl(id)}`
    );

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

      Status: item.benStatus,
      benStatus: item.benStatus,

      Aksi: allowToggle ? ["Edit", "Toggle"] : ["Edit"],

      Alignment: [
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
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
      <h3>Master Golongan</h3>
      <div className="mb-3" style={{ lineHeight: "1.8rem" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "125px" }}>Nama Golongan</span>
          <span style={{ marginRight: "10px" }}>:</span>
          <b>{golonganInfo?.golonganDesc}</b>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ width: "125px" }}>Status</span>
          <span style={{ marginRight: "10px" }}>:</span>
          <b>{golonganInfo?.golonganStatus}</b>
        </div>
      </div>

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
            <Button
              classType="secondary"
              label="Kembali"
              onClick={handleBack}
            />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
