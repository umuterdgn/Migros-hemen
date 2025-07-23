sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    Sorter,
    Filter,
    FilterOperator
  ) {
    "use strict";

    return Controller.extend("migros.controller.Product", {
      onInit: function () {
        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter
          .getRoute("productRoute")
          .attachPatternMatched(this._onObjectMatched, this);

        this.oModel = new JSONModel({
          view: {},
          subcategories: [],
          UrunList: [],
          filteredProducts: [],
          displayedProducts: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            itemsPerPage: 30,
            hasNext: false,
            hasPrev: false,
          },
        });
        this.getView().setModel(this.oModel);
      },

      _onObjectMatched: function (oEvent) {
        const categoryId = oEvent.getParameter("arguments").categoryId;
        const categoryName = oEvent.getParameter("arguments").categoryName;
        this.oModel.setProperty("/view/categoryad", categoryName);
        this._loadSubcategories(categoryId);
        this._loadProductsByCategory(categoryId);
      },

      _loadSubcategories: function (categoryId) {
        $.get(
          `http://localhost:8081/api/getSubCategories?kategori=${categoryId}`,
          (data) => {
            this.oModel.setProperty("/subcategories", data);
            this._bindSubcategories();
          }
        );
      },

      _bindSubcategories: function () {
        const oList = this.byId("subCategoryList");
        const data = this.oModel.getProperty("/subcategories");

        oList.removeAllItems();
        data.forEach((sub) => {
          oList.addItem(
            new sap.m.StandardListItem({
              title: sub.ad,
              customData: [
                new sap.ui.core.CustomData({ key: "id", value: sub.id }),
              ],
            })
          );
        });
      },

      _loadProductsByCategory: function (categoryId) {
        var that = this;
        // $.get(
        //   `http://localhost:8081/api/products-category?categoryId=${categoryId}`,
        //   (data) => {
        $.ajax({
          url:
            "http://localhost:8081/api/products-category?categoryId=" + (categoryId),
          dataType: "json",
          method: "GET",
        success: function (data) {
  for (var i = 0; i < data.length; i++) {
    data[i].src = "data:image/jpeg;base64," + data[i].base64;

   
    const originalPrice = parseFloat(data[i].price);
    const discount = parseFloat(data[i].discount_value);

    if (data[i].discount_type && data[i].discount_type !== "none") {
      data[i].oldPrice = originalPrice.toFixed(2); // Çizgili gösterilecek
      if (data[i].discount_type === "percentage" || data[i].discount_type === "rate") {
        data[i].price = (originalPrice - originalPrice * (discount / 100)).toFixed(2);
      } else if (data[i].discount_type === "fixed") {
        data[i].price = (originalPrice - discount).toFixed(2);
      }
    } else {
      data[i].oldPrice = null;
    }
  }

  // Model set işlemleri
  var oModel = new JSONModel();
  oModel.setData(data);
  that.getOwnerComponent().setModel(oModel, "UrunList");
  that.getOwnerComponent().getModel("UrunList").refresh();
  that.oModel.setProperty("/UrunList", data);
  that._applyFilters();
}

        });
      },

      onSubCategorySelect: function (oEvent) {
        const selectedItem = oEvent.getParameter("listItem");
        const subCatId = selectedItem.getCustomData()[0].getValue();
        const UrunList = this.oModel.getProperty("/UrunList");
        const filtered = UrunList.filter(
          (p) => p.subcategory_id == subCatId
        );
        this.oModel.setProperty("/filteredProducts", filtered);
        this._paginate(1);
      },

      onSearch: function (oEvent) {
        const query = oEvent.getParameter("newValue").toLowerCase();
        const filtered = this.oModel
          .getProperty("/UrunList")
          .filter((p) => p.name.toLowerCase().includes(query));
        this.oModel.setProperty("/filteredProducts", filtered);
        this._paginate(1);
      },

      onSortChange: function (oEvent) {
        const key = oEvent.getParameter("selectedItem").getKey();
        let sorted = [...this.oModel.getProperty("/filteredProducts")];

        switch (key) {
          case "priceAsc":
            sorted.sort((a, b) => a.price - b.price);
            break;
          case "priceDesc":
            sorted.sort((a, b) => b.price - a.price);
            break;
          case "discountAsc":
            sorted.sort((a, b) => a.discount_value - b.discount_value);
            break;
          case "discountDesc":
            sorted.sort((a, b) => b.discount_value - a.discount_value);
            break;
          case "nameAsc":
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "nameDesc":
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        }

        this.oModel.setProperty("/filteredProducts", sorted);
        this._paginate(1);
      },

      _applyFilters: function () {
        const products = this.oModel.getProperty("/UrunList");
        this.oModel.setProperty("/filteredProducts", products);
        this._paginate(1);
      },

      _paginate: function (page) {
        const all = this.oModel.getProperty("/filteredProducts");
        const perPage = this.oModel.getProperty("/pagination/itemsPerPage");
        const totalPages = Math.ceil(all.length / perPage);

        const start = (page - 1) * perPage;
        const pageItems = all.slice(start, start + perPage);

        this.oModel.setProperty("/pagination/currentPage", page);
        this.oModel.setProperty("/pagination/totalPages", totalPages);
        this.oModel.setProperty("/pagination/hasNext", page < totalPages);
        this.oModel.setProperty("/pagination/hasPrev", page > 1);
        this.oModel.setProperty("/displayedProducts", pageItems);

        this._renderProducts(pageItems);
      },

      _renderProducts: function (items) {
        const oBox = this.byId("UrunList");
        oBox.removeAllItems();

        items.forEach((product) => {
          const discount =
            product.discount_type === "rate"
              ? (product.price * (1 - product.discount_value / 100)).toFixed(2)
              : (product.price - product.discount_value).toFixed(2);

          const card = new sap.m.VBox({
  items: [
    new sap.m.Image({
      src: product.src,
      width: "170px",
      height: "150px",
    }),
    new sap.m.Text({
      text: product.name,
    }).addStyleClass("productName"),

    new sap.m.HBox({
      justifyContent: "Start",
      alignItems: "Center",
      items: [
        new sap.m.Text({
          text: product.price + " ₺",
        }).addStyleClass("newPrice"),

        new sap.m.Text({
          text: product.oldPrice ? product.oldPrice + " ₺" : "",
          visible: !!product.oldPrice,
        }).addStyleClass("oldPrice"),
      ],
    }).addStyleClass("priceBox"),

    new sap.m.Button({
      text: "",
      icon: "sap-icon://cart",
      press: () => MessageToast.show(product.name + " sepete eklendi"),
    }).addStyleClass("cartButton"),
  ],
}).addStyleClass("productBox");

          oBox.addItem(card);
        });
      },

      onNextPage: function () {
        const page = this.oModel.getProperty("/pagination/currentPage");
        this._paginate(page + 1);
      },

      onPrevPage: function () {
        const page = this.oModel.getProperty("/pagination/currentPage");
        this._paginate(page - 1);
      },
    });
  }
);
