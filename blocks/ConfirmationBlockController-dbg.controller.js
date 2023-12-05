/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/resource/ResourceModel",
	"sap/i2d/mpe/lib/commons1/utils/formatter"

], function (Controller, ResourceModel, formatter) {
	"use strict";

	return Controller.extend("i2d.mpe.orders.manages1.blocks.ConfirmationBlockController", {
		formatter: formatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf  i2d.mpe.orders.manages1.blocks.ConfirmationBlockController
		 */
		onInit: function () {
			this._osmartTable = this.getView().byId("idAllConfirmationTable");
			// ignoring fields from smart table personalisation
			this._osmartTable.setIgnoreFromPersonalisation(
				"IsFinalConfirmation"
			);
			this.oCommonI18NModel = formatter._i18n;
			if(!this.oCommonI18NModel){
				this.oCommonI18NModel = this.loadI18NFile();
			}
			// Resource model is updated with the commons i18n file.
			this.getView().setModel(this.oCommonI18NModel, "common_i18n");
		},

		/**
		 * Handler for Exporting Excel
		 * This method manually add new columns to the excel that is going to be exported
		 **/
		handleBeforeExport: function (oEvent) {
			var oExportSettings = oEvent.getParameter("exportSettings");
			var oNewColumn = this.getExcelWorkBookParameters("testingScheduledStartTimeFiled", this.getView().getModel("i18n").getResourceBundle()
				.getText("UnitofMeasure"),
				"ConfirmationUnit", "string");
			oExportSettings.workbook.columns.push(oNewColumn);
			//Entry date column with proper date format
			oNewColumn = this.getExcelWorkBookParameters("testingScheduledEndTimeFiled", this.getView().getModel("i18n").getResourceBundle().getText(
					"EntryDateNew"),
				"MfgOrderConfirmationEntryDate", "date");
			oExportSettings.workbook.columns.push(oNewColumn);
			//Entry time column with proper time format
			oNewColumn = this.getExcelWorkBookParameters("testingScheduledEndTimeFiledNew", this.getView().getModel("i18n").getResourceBundle()
				.getText(
					"EntryTimeNew"),
				"MfgOrderConfirmationEntryTime", "time");
			oExportSettings.workbook.columns.push(oNewColumn);
		},

		/**
		 * Getter for adding a new column
		 * This gets a new column by passing the required parameters
		 **/
		getExcelWorkBookParameters: function (sId, sLabel, sProperty, sType) {
			var oExcelCoumn = {
				columnId: sId,
				displayUnit: false,
				falseValue: undefined,
				label: sLabel,
				precision: undefined,
				property: sProperty,
				scale: undefined,
				template: null,
				textAlign: "End",
				trueValue: undefined,
				type: sType,
				unitProperty: undefined,
				width: ""
			};
			return oExcelCoumn;
		},

		loadI18NFile: function () {
			var sI18NFilePath = jQuery.sap.getModulePath("sap.i2d.mpe.lib.commons1") + "/" + "i18n/i18n.properties";
			return new ResourceModel({
				bundleUrl: sI18NFilePath
			});
		},

		getI18NCommonText: function (isKey, aValues) {
			return this.oCommonI18NModel.getResourceBundle().getText(isKey, aValues);
		},

		/** 
		 * Event handler of smart table rebind for Confirmations Table.
		 * Applies filters on smart table based on the Manufacturing order number.
		 * @param ioEvent
		 *  @member i2d.mpe.orders.manages1.blocks.ConfirmationBlockController
		 * @public
		 */
		onHandleRebindAllConfirmationTable: function (ioEvent) {
			var oModel = this.getView().getModel("DetailModel");
			var oOrderDetailData = oModel.getData();
			this.sOrderId = oOrderDetailData.orderId;
			var oOrderValues = ioEvent.getSource().getModel().oData[this.sOrderId];
			var sManufacturingOrder;
			if (oOrderValues) {
				sManufacturingOrder = ioEvent.getSource().getModel().oData[this.sOrderId].ManufacturingOrder;
			}
			if (oOrderDetailData.selectedOrderData && sManufacturingOrder === undefined) {
				sManufacturingOrder = oOrderDetailData.selectedOrderData.ManufacturingOrder;
			}
			var oBindingParams = ioEvent.getParameter("bindingParams");
			oBindingParams.parameters.select += ",MfgOrderConfirmationCount";
			var aFilters = oBindingParams.filters;
			var oFilter = new sap.ui.model.Filter([], true);

			if (sManufacturingOrder) {
				oFilter.aFilters.push(new sap.ui.model.Filter("ManufacturingOrder", sap.ui.model.FilterOperator.EQ, sManufacturingOrder));
				aFilters.push(oFilter);
			}

		},

		/*
		 * Navigate to confirmations App on click of the confirmation item list.
		 * @param oEvent- to get the binding context of the row selected.
		 *@member i2d.mpe.orders.manages1.blocks.ConfirmationBlockController
		 * @public
		 **/
		handleConfirmationSelect: function (oEvent) {
			//navigation with chevron
			var oConfirmationSelected = oEvent.getParameter("listItem").getBindingContext().getObject();
			//navigation with hyperlink
			//var oConfirmationSelected = oEvent.getSource().getBindingContext().getObject();
			var sConfirmation = oConfirmationSelected.MfgOrderConfirmationGroup;
			var iConfirmationCount = oConfirmationSelected.MfgOrderConfirmationCount;
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var sPattern = "&/C_ProdOrdConfObjPg(ProductionOrderConfirmation='" + sConfirmation + "',OperationConfirmationCount='" +
				iConfirmationCount + "')";
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#ProductionOrderConfirmation-displayFactSheet" + sPattern
				}
			});
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onBeforeRendering: function () {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onAfterRendering: function () {},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf org.edu.ui.block.goals.try
		 */
		onExit: function () {}
	});
});