"use client";

import { useState, useCallback, useEffect } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import Toast from "@/components/common/Toast";
import { getUserData } from "@/context/user";

const maxLengthRules = {
  strDesc: 150,
};

export default function AddStrukturPage() {
  const [formData, setFormData] = useState({
    strDesc: "",
    parentId: "",
    tanggalFrom: "",
    tanggalUntil: "",
    strStatus: "Aktif",
  });

  const [parentList, setParentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = getUserData();
    setUserData(user);

    const loadParentList = async () => {
      try {
        const res = await fetchData(API_LINK + "Struktur/GetDataStruktur", {}, "GET");
        const list = res?.data || res?.dataList || [];
        const sorted = list.sort((a, b) => Number(a.strId) - Number(b.strId));
        const formatted = [{ Value: "", Text: "-" }, ...sorted.map((i) => ({
          Value: i.strId,
          Text: i.strDesc,
        }))];
        setParentList(formatted);
      } catch (err) {
        Toast.error("Gagal memuat data struktur induk");
      }
    };

    loadParentList();
  }, []);

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
    if (!formData.strDesc.trim()) newErrors.strDesc = "Nama struktur wajib diisi";
    if (!formData.tanggalFrom) newErrors.tanggalFrom = "Tanggal from wajib diisi";
    if (!formData.tanggalUntil) newErrors.tanggalUntil = "Tanggal until wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      strDesc: "",
      parentId: "",
      tanggalFrom: "",
      tanggalUntil: "",
      strStatus: "Aktif",
    });
  }, []);

const handleSubmit = useCallback(
  async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        NamaStruktur: formData.strDesc.trim(),
        ParentId: formData.parentId || "",
        TanggalFrom: formData.tanggalFrom,
        TanggalUntil: formData.tanggalUntil,
      }).toString();

      const url = `${API_LINK}Struktur/CreateStruktur?${queryParams}`;

      console.log("URL dikirim:", url);

      const data = await fetchData(url, {}, "POST");

      if (data && (data.message === "SUCCESS" || data.message === "Berhasil")) {
        Toast.success("Data struktur berhasil ditambahkan.");
        reset();
        router.push("/pages/Page_Master_Struktur");
      } else {
        Toast.error(data?.message || "Terjadi kesalahan. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Error saat menyimpan struktur:", err);
      Toast.error("Data gagal disimpan! " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  },
  [validateForm, formData, router, reset]
);

  const handleCancel = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Struktur Organisasi"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Struktur Organisasi", href: "/pages/Page_Master_Struktur" },
        { label: "Tambah" },
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
                  error={errors.strDesc}
                  maxLength={maxLengthRules.strDesc}
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
                  error={errors.tanggalFrom}
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
                  error={errors.tanggalUntil}
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
                  iconName={loading ? "" : "save"}
                  label={loading ? "Menyimpan..." : "Simpan"}
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
