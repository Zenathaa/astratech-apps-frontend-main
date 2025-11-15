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

export default function MasterJabatanPage() {
  const router = useRouter();

  const [allDataJabatan, setAllDataJabatan] = useState([]);
  const [dataJabatan, setDataJabatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  const sortRef = useRef();
  const statusRef = useRef();

  const dataFilterSort = useMemo(
    () => [
      { Value: "[jab_desc] asc", Text: "Nama Jabatan [↑]" },
      { Value: "[jab_desc] desc", Text: "Nama Jabatan [↓]" },
    ],
    []
  );

  const dataFilterStatus = useMemo(
    () => [
      { Value: "Aktif", Text: "Aktif" },
      { Value: "Tidak Aktif", Text: "Tidak Aktif" },
    ],
    []
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("[id] asc");
  const [sortStatus, setSortStatus] = useState("Aktif");

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

  const loadData = useCallback(async (sort, cari, status) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (cari) params.append("SearchKeyword", cari);
      if (status) params.append("Status", status);
      if (sort) params.append("Urut", sort);

      const url = `${API_LINK}Jabatan/GetDataJabatan?${params.toString()}`;
      const response = await fetchData(url, {}, "GET");

      if (!response) throw new Error("Tidak ada respon dari server.");

      const dataList = response.data || response.dataList || response.items || [];

      setAllDataJabatan(dataList);
      setTotalData(dataList.length);
      setCurrentPage(1);
    } catch (err) {
      Toast.error(err.message || "Gagal memuat data jabatan.");
      setAllDataJabatan([]);
      setDataJabatan([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let temp = [...allDataJabatan];

    if (search.trim() !== "") {
      temp = temp.filter((item) =>
        (item.jabatanDeskripsi || item.JabatanDesc || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (sortStatus) {
      temp = temp.filter(
        (item) => (item.jabatanStatus || item.Status || "Aktif") === sortStatus
      );
    }

    if (sortBy === "[id] asc") temp.sort((a, b) => a.id - b.id);
    else if (sortBy === "[id] desc") temp.sort((a, b) => b.id - a.id);
    else if (sortBy === "[jab_desc] asc")
      temp.sort((a, b) =>
        (a.jabatanDeskripsi || a.JabatanDesc || "").localeCompare(
          b.jabatanDeskripsi || b.JabatanDesc || ""
        )
      );
    else if (sortBy === "[jab_desc] desc")
      temp.sort((a, b) =>
        (b.jabatanDeskripsi || b.JabatanDesc || "").localeCompare(
          a.jabatanDeskripsi || a.JabatanDesc || ""
        )
      );

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedList = temp.slice(startIndex, endIndex);

    const pagedData = pagedList.map((item, index) => ({
      No: startIndex + index + 1,
      id: item.id,
      "Nama Jabatan": item.jabatanDeskripsi || item.JabatanDesc || "",
      Status: item.jabatanStatus || item.Status || "Aktif",
      Aksi: [
        ...(isClient && userData?.permission?.includes("master_jabatan.edit")
          ? ["Edit", "Toggle"]
          : []),
      ],
      Alignment: ["center", "center", "center", "center"],
    }));

    setDataJabatan(pagedData);
    setTotalData(temp.length);
  }, [allDataJabatan, search, currentPage, pageSize, sortBy, sortStatus, isClient, userData]);

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      loadData(sortBy, query, sortStatus);
    },
    [sortBy, sortStatus, loadData]
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current?.value || sortBy;
    const newSortStatus = statusRef.current?.value || sortStatus;

    setSortBy(newSortBy);
    setSortStatus(newSortStatus);

    loadData(newSortBy, search, newSortStatus);
  }, [sortBy, sortStatus, search, loadData]);

  const handleNavigation = useCallback((page) => setCurrentPage(page), []);

  const handleAdd = useCallback(() => router.push("/pages/Page_Master_Jabatan/add"), [router]);

  const handleEdit = useCallback(
    (id) => router.push(`/pages/Page_Master_Jabatan/edit/${encryptIdUrl(id)}`),
    [router]
  );

  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Ubah Status Jabatan",
        text: "Apakah Anda yakin ingin mengubah status jabatan ini?",
        icon: "warning",
        confirmText: "Ya, ubah!",
      });
      if (!result) return;

      setLoading(true);
      try {
        await fetchData(`${API_LINK}Jabatan/SetStatusJabatan/${id}`, {}, "POST");
        Toast.success("Status jabatan berhasil diubah.");
        await loadData(sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message || "Gagal mengubah status jabatan.");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, loadData]
  );

  useEffect(() => {
    if (isClient && ssoData && userData) {
      loadData(sortBy, search, sortStatus);
    }
  }, [isClient, ssoData, userData]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown ref={sortRef} arrData={dataFilterSort} type="pilih" label="Urutkan" forInput="sortBy" defaultValue={sortBy} />
        <DropDown ref={statusRef} arrData={dataFilterStatus} type="pilih" label="Status" forInput="sortStatus" defaultValue={sortStatus} />
      </>
    ),
    [dataFilterSort, dataFilterStatus, sortBy, sortStatus]
  );

  const showAddButton = useMemo(() => {
    if (!isClient || !userData) return false;
    return Array.isArray(userData?.permission)
      ? userData.permission.includes("master_jabatan.create")
      : false;
  }, [isClient, userData]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Jabatan"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengaturan Dasar" },
        { label: "Jabatan" },
      ]}
    >
      <Formsearch
        onSearch={handleSearch}
        onAdd={handleAdd}
        onFilter={handleFilterApply}
        showAddButton={showAddButton}
        showExportButton={false}
        searchPlaceholder="Cari data jabatan"
        addButtonText="Tambah"
        filterContent={filterContent}
      />

      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table data={dataJabatan} onEdit={handleEdit} onToggle={handleToggle} />
          {totalData > 0 && (
            <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
          )}
        </div>
      </div>
    </MainContent>
  );
}
