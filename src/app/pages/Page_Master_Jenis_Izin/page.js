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

export default function MasterJenisIzinPage() {
  const router = useRouter();

  const [allDataJenisIzin, setAllDataJenisIzin] = useState([]);
  const [dataJenisIzin, setDataJenisIzin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState(null);
  const [ssoData, setSsoData] = useState(null);

  const sortRef = useRef();
  const statusRef = useRef();

  const dataFilterSort = [
    { Value: "[JeiNama] asc", Text: "Nama Jenis Izin [↑]" },
    { Value: "[JeiNama] desc", Text: "Nama Jenis Izin [↓]" },
  ];

  const dataFilterStatus = [
    { Value: "Aktif", Text: "Aktif" },
    { Value: "Tidak Aktif", Text: "Tidak Aktif" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);

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

      const response = await fetchData(
        API_LINK + "JenisCuti/GetDataJenisCuti",
        {
          Status: status,
          ...(cari ? { SearchKeyword: cari } : {}),
          Urut: sort,
        },
        "GET"
      );

      if (!response) throw new Error("Tidak ada respon dari server.");

      const dataList =
        response.data ||
        response.dataList ||
        response.items ||
        response.Data ||
        [];

      setAllDataJenisIzin(dataList);
      setTotalData(dataList.length);
      setCurrentPage(1);
    } catch (err) {
      Toast.error(err.message || "Gagal memuat data jenis izin.");
      setAllDataJenisIzin([]);
      setDataJenisIzin([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Paging client-side
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedList = allDataJenisIzin.slice(startIndex, endIndex);

    const pagedData = pagedList.map((item, index) => ({
      No: startIndex + index + 1,
      id: item.jeiId,
      "Nama Jenis Izin": item.jeiNama,
      Keterangan:
        item.jeiDesc && item.jeiDesc.trim() !== "" ? item.jeiDesc : "-",
      "Jumlah Izin": `${
        item.jeiJumlahIjinDay ? item.jeiJumlahIjinDay : 0
      } hari`,
      "Jumlah Tambahan": `${
        item.jeiJumlahPlusDay ? item.jeiJumlahPlusDay : 0
      } hari`,
      "Berlaku Dari": DateFormatter.formatDateLong(item.jeiValidFrom),
      "Berlaku Sampai": DateFormatter.formatDateLong(item.jeiValidUntil),

      "Hanya Admin": {
        value: item.jeiIsAdminOnly === 1,
        column: "hanyaAdmin",
      },
      "Perlu Berkas": {
        value: item.jeiRequiredFile === 1,
        column: "wajibFile",
      },
      "Diri Sendiri": {
        value: item.jeiIsForSelf === 1,
        column: "diriSendiri",
      },

      Aksi: [
        ...(isClient && userData?.permission?.includes("master_jenis_izin.edit")
          ? ["Edit"]
          : []),
      ],
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
    }));

    setDataJenisIzin(pagedData);
  }, [allDataJenisIzin, currentPage, pageSize, isClient, userData]);

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      loadData(sortBy, query, sortStatus);
    },
    [sortBy, sortStatus, loadData]
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newSortStatus = statusRef.current.value;
    setSortBy(newSortBy);
    setSortStatus(newSortStatus);
    loadData(newSortBy, search, newSortStatus);
  }, [search, loadData]);

  const handleNavigation = useCallback((page) => setCurrentPage(page), []);

  const handleAdd = useCallback(() => {
    router.push("/pages/Page_Master_Jenis_Izin/add");
  }, [router]);

  const handleDetail = useCallback(
    (id) =>
      router.push(`/pages/Page_Master_Jenis_Izin/detail/${encryptIdUrl(id)}`),
    [router]
  );

  const handleEdit = useCallback(
    (id) =>
      router.push(`/pages/Page_Master_Jenis_Izin/edit/${encryptIdUrl(id)}`),
    [router]
  );

  const handleToggle = useCallback(
    async (id, columnName, currentValue) => {
      const newStatus = currentValue ? 0 : 1;

      let endpoint = "";

      if (columnName === "hanyaAdmin") {
        endpoint = `JenisCuti/SetIzinHanyaAdmin/${id}/${newStatus}`;
      } else if (columnName === "wajibFile") {
        endpoint = `JenisCuti/SetIzinFile/${id}/${newStatus}`;
      } else if (columnName === "diriSendiri") {
        endpoint = `JenisCuti/SetIzinSelf/${id}/${newStatus}`;
      } else {
        return Toast.error("Kolom toggle tidak dikenali.");
      }

      const result = await SweetAlert({
        title: "Ubah Status",
        text: "Apakah Anda yakin ingin mengubah status ini?",
        icon: "warning",
        confirmText: "Ya, Ubah!",
      });

      if (!result) return;

      setLoading(true);

      try {
        const response = await fetchData(API_LINK + endpoint, {}, "POST");

        if (!response) throw new Error("Gagal mengubah status.");
        Toast.success("Status berhasil diubah.");

        loadData(sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message || "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, loadData]
  );

  useEffect(() => {
    if (ssoData && userData) {
      loadData(sortBy, search, sortStatus);
    }
  }, [ssoData, userData, sortBy, search, sortStatus]);

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

  const showAddButton = useMemo(() => {
    if (!isClient || !userData) return false;
    return Array.isArray(userData?.permission)
      ? userData.permission.includes("master_jenis_izin.create")
      : false;
  }, [isClient, userData]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Jenis Izin"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Master" },
        { label: "Jenis Izin" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          showAddButton={showAddButton}
          showExportButton={false}
          searchPlaceholder="Cari data jenis izin"
          addButtonText="Tambah"
          filterContent={filterContent}
        />
      </div>

      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table
            data={dataJenisIzin}
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
