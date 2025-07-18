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
        selectedSort: ""
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
        url: `http://localhost:8081/api/category-products/${kategoriID}`,
        method: "GET",
        dataType: "json",
        success: function (data) {
          const model = that.getView().getModel("view");
          model.setProperty("/urunler", data);
          model.setProperty("/filtrelenmisUrunler", data);
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
          model.setProperty("/filtrelenmisUrunler", data);
        },
        error: function (xhr, status, error) {
          console.error("Alt kategori ürünleri alınamadı:", error);
        }
      });
    },

    onSearch: function (oEvent) {
      const query = oEvent.getSource().getValue().toLowerCase();
      const urunler = this.getView().getModel("view").getProperty("/urunler");
      const filtrelenmis = urunler.filter(u => u.ad.toLowerCase().includes(query));
      this.getView().getModel("view").setProperty("/filtrelenmisUrunler", filtrelenmis);
    },

    onSortChange: function (oEvent) {
      const sortKey = oEvent.getSource().getSelectedKey();
      const model = this.getView().getModel("view");
      let products = [...model.getProperty("/filtrelenmisUrunler")];

      if (sortKey === "asc") {
        products.sort((a, b) => a.fiyat - b.fiyat);
      } else if (sortKey === "desc") {
        products.sort((a, b) => b.fiyat - a.fiyat);
      }

      model.setProperty("/filtrelenmisUrunler", products);
    },
    
  });
});
