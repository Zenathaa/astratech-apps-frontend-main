"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import { getSSOData } from "@/context/user";

const maxLengthRules = {
  golonganDesc: 100,
};

const initialFormData = {
  id: 0,
  rowNumber: 0,
  golonganDesc: "",
  status: "",
};

export default function EdtGolonganPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ssoData, setSsoData] = useState(null);

  useEffect(() => {
    const sso = getSSOData();
    if (sso) {
      setSsoData(sso);
    } else {
      Toast.error("Sesi Anda habis. Silakan login kembali.");
      router.push("/auth/login");
    }
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetchData(
        `${API_LINK}Golongan/GetDataGolongan`, 
        { Id: id }, 
        "GET"
      );

      const dataList = response.data || response.dataList || response.items || [];
      
      if (dataList.length > 0) {
        const golonganData = dataList[0]; 
        
        setFormData({
          ...initialFormData,
          ...golonganData,
          id: golonganData.id,
          golonganDesc: golonganData.golonganDesc 
        });

      } else {
        throw new Error("Data golongan tidak ditemukan.");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      Toast.error("Gagal memuat data: " + err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

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

    if (!formData.golonganDesc || !formData.golonganDesc.trim()) {
      newErrors.golonganDesc = "Nama golongan wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Fungsi handleSubmit Anda sudah benar
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field yang wajib diisi.");
        return;
      }

      setLoading(true);

      const dataToSubmit = {
        GolonganID: formData.id,
        GolonganDesc: formData.golonganDesc,
        GolonganModifBy: ssoData?.username || "System",
      };

      try {
        // Ini memanggil 'ess_editGolongan' dan sudah benar
        const data = await fetchData(
          API_LINK + "Golongan/EditGolongan",
          dataToSubmit,
          "PUT"
        );

        if (data && data.message === "SUCCESS") {
          Toast.success("Data golongan berhasil diperbarui.");
          router.push("/pages/Page_Master_Golongan");
        } else {
          Toast.error(data.message || "Terjadi kesalahan. Silakan coba lagi.");
          setLoading(false);
        }
      } catch (err) {
        Toast.error("Data gagal disimpan! " + err.message);
        setLoading(false);
      }
    },
    [formData, router, validateForm, ssoData]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Ubah Golongan"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Golongan", href: "/pages/Page_Master_Golongan" },
        { label: "Ubah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-6">
                <Input
                  label="Nama Golongan"
                  name="golonganDesc"
                  id="golonganDesc"
                  value={formData.golonganDesc || ""} // Sudah benar
                  onChange={handleChange}
                  error={errors.golonganDesc}
                  maxLength={maxLengthRules.golonganDesc}
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