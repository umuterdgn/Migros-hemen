sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("migros.controller.Home", {
    onInit: function () {
      var oThis = this;

      $.ajax({
        url: "http://localhost:8081/api/categories", 
        method: "GET",
        success: function (data) {
          var oModel = new JSONModel({ categories: data });
          oThis.getView().setModel(oModel);
        },
        error: function () {
          MessageToast.show("Kategoriler yüklenemedi.");
        }
      });
    },

    onCategoryPress: function (oEvent) {
      const categoryId = oEvent.getSource().data("categoryId");
      sap.ui.core.UIComponent.getRouterFor(this).navTo("Product", {
        categoryId: categoryId
      });
    }
  });
});
