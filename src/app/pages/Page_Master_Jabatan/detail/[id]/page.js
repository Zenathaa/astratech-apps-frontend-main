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
import DateFormatter from "@/lib/dateFormater";
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

export default function DetailJabatanPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) {
      Toast.error("ID jabatan tidak valid.");
      setLoading(false);
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await fetchData(
        `${API_LINK}Jabatan/DetailJabatan/${id}`,
        {},
        "GET"
      );

      if (!response || !response.data) {
        throw new Error("Data jabatan tidak ditemukan.");
      }

      setData(response.data);
    } catch (err) {
      Toast.error("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback(() => {
    router.push(`/pages/Page_Master_Jabatan/edit/${encryptIdUrl(id)}`);
  }, [router, id]);

  const handleBack = useCallback(() => {
    router.push("/pages/Page_Master_Jabatan");
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Detail Jabatan"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Jabatan",
          href: "/pages/Page_Master_Jabatan",
        },
        { label: "Detail" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          {data && (
            <>
              <div className="mb-4">
                <h5 className="text-primary mb-3 pb-2 border-bottom">
                  Informasi Jabatan
                </h5>
                <div className="row">
                  <DetailItem label="ID Jabatan" value={data.jab_id} />
                  <DetailItem label="Nama Jabatan" value={data.jab_desc} />
                  <DetailItem
                    label="Status"
                    value={<Badge status={data.jab_status} />}
                  />
                  <DetailItem label="Urutan" value={data.jab_order} />
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-primary mb-3 pb-2 border-bottom">
                  Informasi Audit
                </h5>
                <div className="row">
                  <DetailItem label="Dibuat Oleh" value={data.jab_created_by} />
                  <DetailItem
                    label="Tanggal Dibuat"
                    value={DateFormatter.formatDateTime(data.jab_created_date)}
                  />
                  <DetailItem label="Diubah Oleh" value={data.jab_updated_by} />
                  <DetailItem
                    label="Tanggal Diubah"
                    value={DateFormatter.formatDateTime(data.jab_updated_date)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="row mt-4">
            <div className="col-12">
              <div className="d-flex justify-content-end gap-2">
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
      </div>
    </MainContent>
  );
}
