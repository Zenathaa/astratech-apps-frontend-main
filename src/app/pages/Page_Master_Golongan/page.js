"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/components/common/SweetAlert";
import { getSSOData, getUserData } from "@/context/user";

export default function MasterGolonganPage() {
  const router = useRouter();

  // ✅ PERBAIKAN STATE:
  // allDataGolongan: Menyimpan SEMUA data dari API (misal 16 data)
  // dataGolongan: Menyimpan data yang SUDAH DIPOTONG (hanya 5 per halaman)
  const [allDataGolongan, setAllDataGolongan] = useState([]);
  const [dataGolongan, setDataGolongan] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  const sortRef = useRef();
  const statusRef = useRef();

  const dataFilterSort = [
    { Value: "[Golongan] asc", Text: "Nama Golongan [↑]" },
    { Value: "[Golongan] desc", Text: "Nama Golongan [↓]" },
  ];

  const dataFilterStatus = [
    { Value: "Aktif", Text: "Aktif" },
    { Value: "Tidak Aktif", Text: "Tidak Aktif" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(5); // ✅ PERBAIKAN: Diubah ke 5
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);

  // ✅ Pastikan data user & SSO di-load di sisi client (TETAP SAMA)
  useEffect(() => {
    setIsClient(true);
    const sso = getSSOData();
    const user = getUserData();
    setSsoData(sso);
    setUserData(user);

    if (!sso) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("/auth/login");
    }
  }, [router]);

  // ✅ PERBAIKAN: Fungsi ambil data tabel
  // Fungsi ini sekarang mengambil SEMUA data, BUKAN per halaman
  const loadData = useCallback(
    async (sort, cari, status) => {
      try {
        setLoading(true);

        const response = await fetchData(
          API_LINK + "Golongan/GetDataGolongan",
          {
            Status: status,
            ...(cari ? { SearchKeyword: cari } : {}),
            Urut: sort,
            // PageNumber dan PageSize dihapus, karena DB tidak support
          },
          "GET"
        );

        if (!response) throw new Error("Tidak ada respon dari server.");

        const dataList =
          response.data || response.dataList || response.items || [];
        
        // Simpan SEMUA data ke state 'allDataGolongan'
        setAllDataGolongan(dataList);
        
        // Total data dihitung dari JUMLAH data yang diterima
        setTotalData(dataList.length); 
        
        // Selalu reset ke halaman 1 setiap kali filter/search baru
        setCurrentPage(1); 
        
      } catch (err) {
        Toast.error(err.message || "Gagal memuat data golongan.");
        setAllDataGolongan([]);
        setDataGolongan([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [] // Hapus dependensi yang tidak perlu
  );

  // ✅ PERBAIKAN: useEffect BARU untuk menangani Paging di Client
  // Effect ini akan jalan setiap kali 'allDataGolongan' (data master) berubah
  // atau setiap kali 'currentPage' (halaman) diubah
  useEffect(() => {
    
    // Hitung data mana yang harus ditampilkan
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Potong data master (allDataGolongan) sesuai halaman
    const pagedList = allDataGolongan.slice(startIndex, endIndex);

    // Proses data yang sudah dipotong (5 data)
    const pagedData = pagedList.map((item, index) => ({
      // 'No' dihitung berdasarkan 'startIndex' agar urut di semua halaman
      No: startIndex + index + 1, 
      id: item.id,
      "Nama Golongan": item.golonganDesc,
      Status: item.golonganStatus,
      "Plafon Obat": item.benPlafonObat ?? "-",
      "Plafon Lensa Mono": item.benPlafonLensaMono ?? "-",
      "Plafon Lensa Bi": item.benPlafonLensaBi ?? "-",
      "Plafon Rangka": item.benPlafonRangka ?? "-",
      "Status Pernikahan": item.benStatusPernikahan ?? "-",
      Aksi: [
        "Detail",
        ...(isClient && userData?.permission?.includes("master_golongan.edit")
          ? ["Edit", "Toggle"]
          : []),
      ],
      Alignment: [
        "center", "left", "center", "center", "center",
        "center", "center", "center", "center",
      ],
    }));

    // Masukkan 5 data yang sudah diproses ke state 'dataGolongan' (untuk ditampilkan)
    setDataGolongan(pagedData);

  }, [allDataGolongan, currentPage, pageSize, isClient, userData]);


  // ✅ PERBAIKAN: Fungsi pencarian
  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      // 'loadData' tidak perlu 'currentPage' lagi
      loadData(sortBy, query, sortStatus); 
    },
    [sortBy, sortStatus, loadData]
  );

  // ✅ PERBAIKAN: Filter Sort dan Status
  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newSortStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setSortStatus(newSortStatus);
    // 'loadData' tidak perlu 'currentPage' lagi
    loadData(newSortBy, search, newSortStatus);
  }, [search, loadData]);

  // ✅ PERBAIKAN: Navigasi halaman
  const handleNavigation = useCallback(
    (page) => {
      // Hanya perlu ganti halaman, useEffect di atas akan urus sisanya
      setCurrentPage(page);
    },
    [] // Tidak ada dependensi
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/Page_Master_Golongan/add");
  }, [router]);

  const handleDetail = useCallback(
    (id) => router.push(`/pages/Page_Master_Golongan/detail/${encryptIdUrl(id)}`),
    [router]
  );

  const handleEdit = useCallback(
    (id) => router.push(`/pages/Page_Master_Golongan/edit/${encryptIdUrl(id)}`),
    [router]
  );

  // ✅ PERBAIKAN: Ubah status Golongan
  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Ubah Status Golongan",
        text: "Apakah Anda yakin ingin mengubah status golongan ini?",
        icon: "warning",
        confirmText: "Ya, ubah!",
      });

      if (!result) return;

      setLoading(true);

      try {
        const data = await fetchData(
          API_LINK + "Golongan/SetStatusGolongan/" + id,
          {},
          "POST"
        );

        if (data?.error) {
          throw new Error(data.message);
        }

        Toast.success("Status golongan berhasil diubah.");
        // Panggil ulang 'loadData' untuk refresh SEMUA data
        loadData(sortBy, search, sortStatus); 
      } catch (err) {
        Toast.error(err.message || "Gagal mengubah status golongan.");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, loadData] // update dependensi
  );

  // ✅ PERBAIKAN: Jalankan loadData
  // Dijalankan HANYA saat filter berubah, atau saat pertama kali load
  useEffect(() => {
    if (ssoData && userData) {
      loadData(sortBy, search, sortStatus);
    }
    // Hapus 'currentPage' dan 'loadData' dari dependensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssoData, userData, sortBy, search, sortStatus]); 

  // ✅ Filter dropdown (TETAP SAMA)
  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={sortRef}
          arrData={dataFilterSort}
          type="pilih"
          label="Urutkan"
          forInput="sortBy"
          defaultValue={sortBy}
        />
        <DropDown
          ref={statusRef}
          arrData={dataFilterStatus}
          type="pilih"
          label="Status"
          forInput="sortStatus"
          defaultValue={sortStatus}
        />
      </>
    ),
    [sortBy, sortStatus]
  );

  // ✅ Cek izin tampil tombol Tambah (TETAP SAMA)
  const showAddButton = useMemo(() => {
    if (!isClient || !userData) return false;
    return Array.isArray(userData?.permission)
      ? userData.permission.includes("master_golongan.create")
      : false;
  }, [isClient, userData]);

  // ✅ Render HTML (TETAP SAMA)
  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Golongan"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengaturan Dasar" },
        { label: "Golongan" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          showAddButton={showAddButton}
          showExportButton={false}
          searchPlaceholder="Cari data golongan"
          addButtonText="Tambah"
          filterContent={filterContent}
        />
      </div>

      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table
            data={dataGolongan} // <-- Ini sudah berisi 5 data
            onDetail={handleDetail}
            onEdit={handleEdit}
            onToggle={handleToggle}
          />
          {totalData > 0 && (
            <Paging
              pageSize={pageSize} // <-- Ini isinya 5
              pageCurrent={currentPage}
              totalData={totalData} // <-- Ini isinya 16 (total)
              navigation={handleNavigation}
            />
          )}
        </div>
      </div>
    </MainContent>
  );
}