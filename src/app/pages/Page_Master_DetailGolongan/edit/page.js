"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import MainContent from "@/components/layout/MainContent";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import DropDown from "@/components/common/Dropdown";
import Calendar from "@/components/common/Calendar";
import Button from "@/components/common/Button";

import Toast from "@/components/common/Toast";
import Loading from "@/components/common/Loading"; 

import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";

export default function EditDetailGolonganPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false); 
  const [pageLoading, setPageLoading] = useState(true); 
  
  const [benId, setBenId] = useState(null);
  const [plafonObat, setPlafonObat] = useState("");
  const [plafonLensaMono, setPlafonLensaMono] = useState("");
  const [plafonLensaBi, setPlafonLensaBi] = useState("");
  const [plafonRangka, setPlafonRangka] = useState("");
  const [statusNikah, setStatusNikah] = useState("");
  const [rangeDate, setRangeDate] = useState([null, null]);
  const [modifBy, setModifBy] = useState("admin_dev_edit");
  
  const [errors, setErrors] = useState({});

  const dataStatusNikah = [
    { Value: "Lajang", Text: "Lajang" },
    { Value: "Menikah", Text: "Menikah" },
  ];

  const loadData = useCallback(async (idToLoad) => {
    if (!idToLoad) return;
    setPageLoading(true);
    try {
      const response = await fetchData(
        `${API_LINK}detailGolongan/GetDetailBenefit/${idToLoad}`, 
        {}, 
        "GET"
      );
      
      setPlafonObat(response.benPlafonObat || "");
      setPlafonLensaMono(response.benPlafonLensaMono || "");
      setPlafonLensaBi(response.benPlafonLensaBi || "");
      setPlafonRangka(response.benPlafonRangka || "");
      setStatusNikah(response.benStatusPernikahan || "");
      
      if (response.benValidDateFrom && response.benValidDateUntil) {
        setRangeDate([
          new Date(response.benValidDateFrom), 
          new Date(response.benValidDateUntil)
        ]);
      }
      
    } catch (err) {
      Toast.error("Gagal memuat data benefit: " + err.message);
      router.back();
    } finally {
      setPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const encryptedId = searchParams.get("benId");
    if (encryptedId) {
      const decryptedId = decryptIdUrl(encryptedId);
      setBenId(decryptedId);
      loadData(decryptedId);
    } else {
      Toast.error("ID Benefit tidak valid.");
      router.back();
    }
  }, [searchParams, router, loadData]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const  validateForm = () => {
    const newErrors = {};
    if (!benId) newErrors.benId = "ID Benefit tidak ditemukan.";
    if (!plafonObat) newErrors.plafonObat = "Plafon Obat wajib diisi.";
    if (!statusNikah) newErrors.statusNikah = "Status Nikah wajib dipilih.";
    if (!rangeDate[0] || !rangeDate[1]) newErrors.rangeDate = "Tanggal Valid dan Sampai wajib diisi.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Toast.error("Silakan lengkapi semua field yang wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        benId: parseInt(benId, 10),
        benPlafonObat: parseFloat(plafonObat) || 0,
        benPlafonLensaMono: parseFloat(plafonLensaMono) || 0,
        benPlafonLensaBi: parseFloat(plafonLensaBi) || 0,
        benPlafonRangka: parseFloat(plafonRangka) || 0,
        benStatusPernikahan: statusNikah,
        benValidDateFrom: rangeDate[0].toISOString().split('T')[0],
        benValidDateUntil: rangeDate[1].toISOString().split('T')[0],
        benModifBy: modifBy, 
      };
      
      await fetchData(
        `${API_LINK}detailGolongan/UpdateDetailGolongan`, 
        payload,
        "PUT"
      );

      Toast.success("Data benefit berhasil diupdate.");
      handleBack(); 
    } catch (err) {
      Toast.error("Gagal mengupdate data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainContent
      layout="Admin"
      loading={pageLoading}
      title="Edit Data Benefit"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        { label: "Golongan", href: "/pages/Page_Master_Golongan" },
        { label: "Detail Benefit", onClick: handleBack },
        { label: "Edit" },
      ]}
    >
      <Card>
        <Loading loading={pageLoading} /> 
        
        {!pageLoading && (
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <h5 className="text-primary mb-2 pb-2 border-bottom">
                Detail Plafon
              </h5>
              
              <div className="col-md-6">
                <Input
                  label="Plafon Obat"
                  name="plafonObat"
                  type="number"
                  value={plafonObat}
                  onChange={(e) => setPlafonObat(e.target.value)}
                  error={errors.plafonObat}
                  placeholder="Contoh: 2000000"
                  isRequired
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Plafon Rangka"
                  name="plafonRangka"
                  type="number"
                  value={plafonRangka}
                  onChange={(e) => setPlafonRangka(e.target.value)}
                  placeholder="Contoh: 500000"
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Plafon Lensa Mono"
                  name="plafonLensaMono"
                  type="number"
                  value={plafonLensaMono}
                  onChange={(e) => setPlafonLensaMono(e.target.value)}
                  placeholder="Contoh: 300000"
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Plafon Lensa Bi"
                  name="plafonLensaBi"
                  type="number"
                  value={plafonLensaBi}
                  onChange={(e) => setPlafonLensaBi(e.target.value)}
                  placeholder="Contoh: 700000"
                />
              </div>

              <h5 className="text-primary mt-4 mb-2 pb-2 border-bottom">
                Info Lainnya
              </h5>

              <div className="col-md-6">
                <DropDown
                  label="Status Nikah"
                  forInput="ddStatusNikah"
                  type="pilih"
                  value={statusNikah}
                  onChange={(e) => setStatusNikah(e.target.value)}
                  arrData={dataStatusNikah}
                  error={errors.statusNikah}
                  isRequired
                />
              </div>
              <div className="col-md-6">
                <Calendar
                  type="range"
                  label="Tanggal Valid (Dari - Sampai)"
                  value={rangeDate}
                  onChange={(date) => setRangeDate(date)}
                  error={errors.rangeDate}
                  isRequired
                />
              </div>

              <div className="col-12 mt-4">
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    classType="secondary"
                    label="Kembali"
                    onClick={handleBack}
                    type="button"
                  />
                  <Button
                    classType="primary"
                    iconName="floppy"
                    label="Update" 
                    type="submit"
                    isLoading={loading} 
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </Card>
    </MainContent>
  );
}