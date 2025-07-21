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

      // Model'deki property isimlerini view bindinglerine göre ayarladım
      this.getView().setModel(new JSONModel({
        urunler: [],
        filtrelenmisUrunler: [],
        altKategoriler: [],
        categoryad: "",
        searchQuery: "",
        selectedSort: "",
        currentPage: 1,
        pageSize: 30,
        hasMorePages: false
      }), "view");
    },

    _onObjectMatched: function (oEvent) {
      const categoryId = oEvent.getParameter("arguments").categoryId;
      this.kategoriID = categoryId;

      this.getUrunler(categoryId);
      this.getAltKategoriler(categoryId);
    },

    getUrunler: function (categoryId) {
      const that = this;
      $.ajax({
        url: `http://localhost:8081/api/products?categoryId=${categoryId}`,
        method: "GET",
        dataType: "json",
        success: function (data) {
          const model = that.getView().getModel("view");
          model.setProperty("/urunler", data);
          model.setProperty("/currentPage", 1);
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
      const selectedSubCat = oEvent.getSource().getBindingContext("view").getObject();
      const model = this.getView().getModel("view");
      const allProducts = model.getProperty("/urunler");

      // Alt kategoriye göre filtreleme
      const filtered = allProducts.filter(p => p.subcategory_id === selectedSubCat.id);

      model.setProperty("/filtrelenmisUrunler", filtered);
      model.setProperty("/currentPage", 1);
      model.setProperty("/hasMorePages", false);  // Sayfalama kapalı burada
    },

    onSearch: function (oEvent) {
      const query = oEvent.getSource().getValue().toLowerCase();
      const model = this.getView().getModel("view");
      model.setProperty("/searchQuery", query);
      model.setProperty("/currentPage", 1);
      this._applyFilterSortPage();
    },

    onSortChange: function (oEvent) {
      const sortKey = oEvent.getSource().getSelectedKey();
      const model = this.getView().getModel("view");
      model.setProperty("/selectedSort", sortKey);
      model.setProperty("/currentPage", 1);
      this._applyFilterSortPage();
    },

    onNextPage: function () {
      const model = this.getView().getModel("view");
      const currentPage = model.getProperty("/currentPage");
      if (model.getProperty("/hasMorePages")) {
        model.setProperty("/currentPage", currentPage + 1);
        this._applyFilterSortPage();
      }
    },

    onPrevPage: function () {
      const model = this.getView().getModel("view");
      const currentPage = model.getProperty("/currentPage");
      if (currentPage > 1) {
        model.setProperty("/currentPage", currentPage - 1);
        this._applyFilterSortPage();
      }
    },

    onAddToCart: function (oEvent) {
      const product = oEvent.getSource().getBindingContext("view").getObject();
      MessageToast.show(product.ad + " sepete eklendi!");
    },

    _applyFilterSortPage: function () {
      const model = this.getView().getModel("view");
      const urunler = model.getProperty("/urunler") || [];
      const query = (model.getProperty("/searchQuery") || "").toLowerCase();
      const sortKey = model.getProperty("/selectedSort");
      const page = model.getProperty("/currentPage");
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
      model.setProperty("/hasMorePages", end < filtered.length);
    }

  });
});
