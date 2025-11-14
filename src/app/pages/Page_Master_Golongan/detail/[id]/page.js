"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import Badge from "@/components/common/Badge";

const DetailItem = ({ label, value }) => (
  <div className="col-lg-4 mb-3">
    <div className="detail-item">
      <small className="text-muted d-block mb-1">
        <strong>{label}</strong>
      </small>
      {value !== null && value !== undefined && value !== "" ? value : "-"}
    </div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default function DetailGolonganPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    loadData();
  }, [loadData]);

  const handleEdit = useCallback(() => {
    router.push(`/pages/Page_Master_Golongan/edit/${encryptIdUrl(id)}`);
  }, [router, id]);

  const handleBack = useCallback(() => {
    router.push("/pages/Page_Master_Golongan");
  }, [router]);

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
