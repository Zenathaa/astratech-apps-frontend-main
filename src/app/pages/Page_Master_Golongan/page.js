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

  const [allDataGolongan, setAllDataGolongan] = useState([]);
  const [dataGolongan, setDataGolongan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  const sortRef = useRef();
  const statusRef = useRef();

  const dataFilterSort = useMemo(
    () => [
      { Value: "[gol_desc] asc", Text: "Nama Golongan [↑]" },
      { Value: "[gol_desc] desc", Text: "Nama Golongan [↓]" }
    ],
    []
  );

  const dataFilterStatus = useMemo(
    () => [
      { Value: "Aktif", Text: "Aktif" },
      { Value: "Tidak Aktif", Text: "Tidak Aktif" }
    ],
    []
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("[gol_desc] asc");
  const [sortStatus, setSortStatus] = useState("Aktif");
  const [totalData, setTotalData] = useState(0);

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

  const loadData = useCallback(
    async (
      sort = "[gol_desc] asc",
      keyword = search,
      status = sortStatus
    ) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (keyword) params.append("SearchKeyword", keyword);
        if (status) params.append("Status", status);
        params.append("Urut", sort);

        const url = `${API_LINK}Golongan/GetDataGolongan?${params.toString()}`;
        const response = await fetchData(url, {}, "GET");

        if (!response) throw new Error("Tidak ada respon dari server.");

        const dataList =
          response.data || response.dataList || response.items || [];

        dataList.sort((a, b) =>
          (a.golonganDesc ||
            a.GolonganDesc ||
            a.gol_desc ||
            "").localeCompare(
            b.golonganDesc || b.GolonganDesc || b.gol_desc || ""
          )
        );

        setAllDataGolongan(dataList);
        setTotalData(dataList.length);
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
    [search, sortStatus]
  );

  useEffect(() => {
    let temp = [...allDataGolongan];

    if (search.trim() !== "") {
      temp = temp.filter((item) =>
        (item.golonganDesc ||
          item.GolonganDesc ||
          item.gol_desc ||
          "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (sortStatus) {
      temp = temp.filter(
        (item) =>
          (item.golonganStatus || item.Status || "Aktif") === sortStatus
      );
    }

    if (sortBy === "[gol_desc] asc")
      temp.sort((a, b) =>
        (a.golonganDesc || a.GolonganDesc || a.gol_desc || "").localeCompare(
          b.golonganDesc || b.GolonganDesc || b.gol_desc || ""
        )
      );
    else if (sortBy === "[gol_desc] desc")
      temp.sort((a, b) =>
        (b.golonganDesc || b.GolonganDesc || b.gol_desc || "").localeCompare(
          a.golonganDesc || a.GolonganDesc || a.gol_desc || ""
        )
      );

    const start = (currentPage - 1) * pageSize;
    const pagedList = temp.slice(start, start + pageSize);

    const tableData = pagedList.map((item, idx) => ({
      No: start + idx + 1,
      id: item.id,
      "Nama Golongan":
        item.golonganDesc || item.GolonganDesc || item.gol_desc || "",
      Status: item.golonganStatus || item.Status || "Aktif",
      Aksi: [
        "Detail",
        ...(isClient && userData?.permission?.includes("master_golongan.edit")
          ? ["Edit", "Toggle"]
          : [])
      ],
      Alignment: ["center", "center", "center", "center"]
    }));

    setDataGolongan(tableData);
    setTotalData(temp.length);
  }, [
    allDataGolongan,
    search,
    currentPage,
    pageSize,
    sortBy,
    sortStatus,
    isClient,
    userData
  ]);

  const handleSearch = useCallback(
    (q) => {
      setSearch(q);
      loadData(sortBy, q, sortStatus);
    },
    [sortBy, sortStatus, loadData]
  );

  const handleFilterApply = useCallback(() => {
    const s1 = sortRef.current?.value || sortBy;
    const s2 = statusRef.current?.value || sortStatus;
    setSortBy(s1);
    setSortStatus(s2);
    loadData(s1, search, s2);
  }, [sortBy, sortStatus, search, loadData]);

  const handleNavigation = useCallback((p) => setCurrentPage(p), []);

  const handleAdd = useCallback(
    () => router.push("/pages/Page_Master_Golongan/add"),
    [router]
  );

  const handleDetail = useCallback(
    (id) =>
      router.push(
        `/pages/Page_Master_Golongan/detail/${encryptIdUrl(id)}`
      ),
    [router]
  );

  const handleEdit = useCallback(
    (id) =>
      router.push(
        `/pages/Page_Master_Golongan/edit/${encryptIdUrl(id)}`
      ),
    [router]
  );

  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Ubah Status Golongan",
        text: "Apakah Anda yakin ingin mengubah status golongan ini?",
        icon: "warning",
        confirmText: "Ya, ubah!"
      });
      if (!result) return;

      setLoading(true);
      try {
        await fetchData(
          `${API_LINK}Golongan/SetStatusGolongan/${id}`,
          {},
          "POST"
        );
        Toast.success("Status golongan berhasil diubah.");
        await loadData(sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message || "Gagal mengubah status golongan.");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, loadData]
  );

  useEffect(() => {
    if (isClient && ssoData && userData) loadData();
  }, [isClient, ssoData, userData, loadData]);

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
    [dataFilterSort, dataFilterStatus, sortBy, sortStatus]
  );

  const showAddButton = useMemo(() => {
    if (!isClient || !userData) return false;
    return Array.isArray(userData?.permission)
      ? userData.permission.includes("master_golongan.create")
      : false;
  }, [isClient, userData]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Golongan"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengaturan Dasar" },
        { label: "Golongan" }
      ]}
    >
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

      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table
            data={dataGolongan}
            onDetail={handleDetail}
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