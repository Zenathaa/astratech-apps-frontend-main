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
import DateFormatter from "@/lib/dateFormater";

export default function MasterStrukturPage() {
  const router = useRouter();

  const [allDataStruktur, setAllDataStruktur] = useState([]);
  const [dataStruktur, setDataStruktur] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  const sortRef = useRef();
  const statusRef = useRef();

  const dataFilterSort = [
    { Value: "[StrDesc] asc", Text: "Nama Struktur [↑]" },
    { Value: "[StrDesc] desc", Text: "Nama Struktur [↓]" },
    { Value: "[TanggalFrom] asc", Text: "Tanggal From [↑]" },
    { Value: "[TanggalFrom] desc", Text: "Tanggal From [↓]" },
  ];

  const dataFilterStatus = [
    { Value: "Semua", Text: "Semua" },
    { Value: "Aktif", Text: "Aktif" },
    { Value: "Tidak Aktif", Text: "Tidak Aktif" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState("Semua");

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchData(API_LINK + "Struktur/GetDataStruktur", {}, "GET");

      if (!response) throw new Error("Tidak ada respon dari server.");

      let dataList = response.data || response.dataList || response.items || [];

      dataList = dataList.sort((a, b) => Number(a.strId) - Number(b.strId));

      setAllDataStruktur(dataList);
      setTotalData(dataList.length);
      setCurrentPage(1);
    } catch (err) {
      Toast.error(err.message || "Gagal memuat data struktur.");
      setAllDataStruktur([]);
      setDataStruktur([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterDataClient = useCallback(() => {
    let filtered = [...allDataStruktur];

    if (sortStatus !== "Semua") {
      filtered = filtered.filter(
        (item) => item.strStatus?.toLowerCase() === sortStatus.toLowerCase()
      );
    }

    if (search.trim() !== "") {
      const keyword = search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.strDesc?.toLowerCase().includes(keyword) ||
          item.parentId?.toString().toLowerCase().includes(keyword) ||
          item.strStatus?.toLowerCase().includes(keyword)
      );
    }

    filtered = filtered.sort((a, b) => Number(a.strId) - Number(b.strId));

    setTotalData(filtered.length);

    const startIndex = (currentPage - 1) * pageSize;
    const pagedList = filtered.slice(startIndex, startIndex + pageSize);

    const pagedData = pagedList.map((item, index) => ({
      No: startIndex + index + 1,
      id: item.strId,
      "Nama Struktur": item.strDesc,
      Parent:
        item.parentId === "" || item.parentId === null ? "-" : item.parentId,
      "Tanggal From": item.tanggalFrom
        ? DateFormatter.formatDate(item.tanggalFrom)
        : "-",
      "Tanggal Until": item.tanggalUntil
        ? DateFormatter.formatDate(item.tanggalUntil)
        : "-",
      Status: item.strStatus,
      Aksi: [
        ...(isClient && userData?.permission?.includes("master_struktur.edit")
          ? ["Edit", "Toggle"]
          : []),
      ],
      Alignment: [
        "center",
        "left",
        "center",
        "center",
        "center",
        "center",
      ],
    }));

    setDataStruktur(pagedData);
  }, [allDataStruktur, search, sortStatus, currentPage, pageSize, isClient, userData]);

  useEffect(() => {
    if (ssoData && userData) loadData();
  }, [ssoData, userData, loadData]);

  useEffect(() => {
    if (allDataStruktur.length > 0) filterDataClient();
  }, [allDataStruktur, search, sortStatus, currentPage, filterDataClient]);

  const handleSearch = useCallback((query) => setSearch(query), []);
  const handleFilterApply = useCallback(() => {
    setSortStatus(statusRef.current.value);
    setCurrentPage(1);
  }, []);
  const handleNavigation = useCallback((page) => setCurrentPage(page), []);

  const handleAdd = useCallback(() => router.push("/pages/Page_Master_Struktur/add"), [router]);
  const handleEdit = useCallback(
    (id) => router.push(`/pages/Page_Master_Struktur/edit/${encryptIdUrl(id)}`),
    [router]
  );

  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Ubah Status Struktur",
        text: "Apakah Anda yakin ingin mengubah status struktur ini?",
        icon: "warning",
        confirmText: "Ya, ubah!",
      });

      if (!result) return;
      setLoading(true);

      try {
        const currentItem = allDataStruktur.find(item => item.strId === id);
        if (!currentItem) {
          throw new Error("Data struktur tidak ditemukan");
        }

        const newStatus = currentItem.strStatus === "Aktif" ? "Tidak Aktif" : "Aktif";

        console.log(`Toggle status ID ${id} dari "${currentItem.strStatus}" ke "${newStatus}"`);

        const data = await fetchData(
          `${API_LINK}Struktur/SetStatusStruktur?id=${id}&status=${encodeURIComponent(newStatus)}`,
          {},
          "POST"
        );

        if (data?.error) throw new Error(data.message);

        Toast.success("Status struktur berhasil diubah.");
        loadData();
      } catch (err) {
        Toast.error(err.message || "Gagal mengubah status struktur.");
      } finally {
        setLoading(false);
      }
    },
    [loadData, allDataStruktur]
  );

  const filterContent = useMemo(
    () => (
      <>
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
    [sortStatus]
  );

  const showAddButton = useMemo(() => {
    if (!isClient || !userData) return false;
    return Array.isArray(userData?.permission)
      ? userData.permission.includes("master_struktur.create")
      : false;
  }, [isClient, userData]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Struktur Organisasi"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengaturan Dasar" },
        { label: "Struktur Organisasi" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          showAddButton={showAddButton}
          showExportButton={false}
          searchPlaceholder="Cari struktur organisasi"
          addButtonText="Tambah Struktur"
          filterContent={filterContent}
        />
      </div>

      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table
            data={dataStruktur}
            onEdit={handleEdit}
            onToggle={handleToggle}
          />
          {totalData > 0 && (
            <Paging
              pageSize={pageSize}
              pageCurrent={currentPage}
              totalData={totalData}
              navigation={handleNavigation}
            />
          )}
        </div>
      </div>
    </MainContent>
  );
}