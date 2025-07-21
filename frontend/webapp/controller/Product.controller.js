sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("migros.controller.Product", {

    onInit: function () {
      this.oRouter = this.getOwnerComponent().getRouter();
      this.oRouter.getRoute("productRoute").attachPatternMatched(this._onObjectMatched, this);

      this.getView().setModel(new JSONModel({
        urunler: [],
        filtrelenmisUrunler: [],
        altKategoriler: [],
        categoryad: "",
        searchQuery: "",
        selectedSort: "",
        page: 1,
        pageSize: 30,
        hasNextPage: false
      }), "view");
    },

    _onObjectMatched: function (oEvent) {
      const categoryId = oEvent.getParameter("arguments").categoryId;
      this.kategoriID = categoryId;

      this.getUrunler(categoryId);
      this.getAltKategoriler(categoryId);
    },

    getUrunler: function (kategoriID) {
      const that = this;
      $.ajax({
        url: `http://localhost:8081/api/products-category/${kategoriID}`,
        method: "GET",
        dataType: "json",
        success: function (data) {
          const model = that.getView().getModel("view");
          model.setProperty("/urunler", data);
          model.setProperty("/page", 1);
          that._applyFilterSortPage();
        },
        error: function (xhr, status, error) {
          console.error("Ürünler alınamadı:", error);
        }
      });
    },

    getAltKategoriler: function (kategoriID) {
      const that = this;
      $.ajax({
        url: `http://localhost:8081/api/getSubCategories?kategori=${kategoriID}`,
        method: "GET",
        dataType: "json",
        success: function (data) {
          const model = that.getView().getModel("view");
          model.setProperty("/altKategoriler", data);
        },
        error: function (xhr, status, error) {
          console.error("Alt kategoriler alınamadı:", error);
        }
      });
    },

    onAltKategoriSecildi: function (oEvent) {
      const selectedId = oEvent.getSource().getBindingContext("view").getObject().id;
      const that = this;

      $.ajax({
        url: `http://localhost:8081/api/products?subcategory_id=${selectedId}`,
        method: "GET",
        dataType: "json",
        success: function (data) {
          const model = that.getView().getModel("view");
          model.setProperty("/urunler", data);
          model.setProperty("/page", 1);
          that._applyFilterSortPage();
        },
        error: function (xhr, status, error) {
          console.error("Alt kategori ürünleri alınamadı:", error);
        }
      });
    },

   onSearch: function (oEvent) {
  const query = oEvent.getSource().getValue().toLowerCase();
  const model = this.getView().getModel("view");
  model.setProperty("/searchQuery", query); // Bunu ekle
  this._applyFilterSortPage();
},



    onSortChange: function (oEvent) {
      const sortKey = oEvent.getSource().getSelectedKey();
      const model = this.getView().getModel("view");
      model.setProperty("/selectedSort", sortKey);
      model.setProperty("/page", 1);
      this._applyFilterSortPage();
    },

    onNextPage: function () {
      const model = this.getView().getModel("view");
      const currentPage = model.getProperty("/page");
      if (model.getProperty("/hasNextPage")) {
        model.setProperty("/page", currentPage + 1);
        this._applyFilterSortPage();
      }
    },

    onPreviousPage: function () {
      const model = this.getView().getModel("view");
      const currentPage = model.getProperty("/page");
      if (currentPage > 1) {
        model.setProperty("/page", currentPage - 1);
        this._applyFilterSortPage();
      }
    },

    onSepeteEkle: function (oEvent) {
      const product = oEvent.getSource().getBindingContext("view").getObject();
      MessageToast.show(product.ad + " sepete eklendi!");
    },

    _applyFilterSortPage: function () {
  const model = this.getView().getModel("view");
  const urunler = model.getProperty("/urunler") || [];
  const query = (model.getProperty("/searchQuery") || "").toLowerCase();
  const sortKey = model.getProperty("/selectedSort");
  const page = model.getProperty("/page");
  const pageSize = model.getProperty("/pageSize");

  // Filtreleme
  let filtered = urunler.filter(u => u.ad && u.ad.toLowerCase().includes(query));

  // Sıralama
  if (sortKey === "asc") {
    filtered.sort((a, b) => a.fiyat - b.fiyat);
  } else if (sortKey === "desc") {
    filtered.sort((a, b) => b.fiyat - a.fiyat);
  }

  // Sayfalama
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedItems = filtered.slice(start, end);

  model.setProperty("/filtrelenmisUrunler", pagedItems);

  // Sonraki sayfa var mı?
  model.setProperty("/hasNextPage", end < filtered.length);
}

  });
});
