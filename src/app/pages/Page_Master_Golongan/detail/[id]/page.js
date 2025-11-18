"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import MainContent from "@/components/layout/MainContent";
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
  const [data, setData] = useState(null);
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
    if (!id) {
      Toast.error("ID golongan tidak valid.");
      setLoading(false);
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await fetchData(
        `${API_LINK}Golongan/GetListGolongan?Id=${encodeURIComponent(id)}`,
        {},
        "GET"
      );

      const g = response?.data?.[0];

      if (!g) {
        Toast.error("Data golongan tidak ditemukan.");
        setData(null);
      } else {
        setData({
          golonganDesc: g.gol_desc,
          golonganStatus: g.gol_status,
          BenPlafonObat: g.ben_plafon_obat ?? null,
          BenPlafonLensaMono: g.ben_plafon_lensa_mono ?? null,
          BenPlafonLensaBi: g.ben_plafon_lensa_bi ?? null,
          BenPlafonRangka: g.ben_plafon_rangka ?? null,
          BenStatusPernikahan: g.ben_status_pernikahan ?? null,
        });
      }
    } catch (err) {
      console.error(err);
      Toast.error("Gagal memuat data golongan.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

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
      "Plafon Lensa Mono": `Rp ${item.benPlafonLensaMono?.toLocaleString("id-ID") ?? "-"
        }`,
      "Plafon Lensa Bi": `Rp ${item.benPlafonLensaBi?.toLocaleString("id-ID") ?? "-"
        }`,
      "Plafon Rangka": `Rp ${item.benPlafonRangka?.toLocaleString("id-ID") ?? "-"
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
      title="Detail Golongan"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Golongan", href: "/pages/Page_Master_Golongan" },
        { label: "Detail" },
      ]}
    >
      <h3> Master Golongan</h3>
      <div className="mb-3" style={{ lineHeight: "1.8rem" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <span>Nama Golongan</span>
          <span>:</span>
          <b>{golonganInfo?.golonganDesc}</b>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <span>Status</span>
          <span>:</span>
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
          {data ? (
            <div className="row">
              <DetailItem label="Nama Golongan" value={data.golonganDesc} />
              <DetailItem label="Status" value={<Badge status={data.golonganStatus} />} />
              <DetailItem label="Plafon Obat" value={data.BenPlafonObat} />
              <DetailItem label="Plafon Lensa Mono" value={data.BenPlafonLensaMono} />
              <DetailItem label="Plafon Lensa Bi" value={data.BenPlafonLensaBi} />
              <DetailItem label="Plafon Rangka" value={data.BenPlafonRangka} />
              <DetailItem label="Status Pernikahan" value={data.BenStatusPernikahan} />
            </div>
          ) : (
            <p className="text-center text-muted">Tidak ada data untuk golongan ini.</p>
          )}

          <div className="row mt-4">
            <div className="col-12 d-flex justify-content-end gap-2">
              <Button
                classType="secondary"
                label="Kembali"
                onClick={handleBack}
                type="button"
              />
              <Button
                classType="primary"
                iconName="pencil"
                label="Edit"
                onClick={handleEdit}
                type="button"
              />
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
