/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["jquery.sap.global",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"i2d/mpe/orders/manages1/model/formatter",
	"sap/m/MessageBox"
], function (jquery, JSONModel, Filter, FilterOperator, Sorter, formatter, MessageBox) {
	"use strict";

	return {
		formatter: formatter,
		initAndOpen: function (oParams) {
			var oDialog = new sap.ui.core.Fragment.load({
				name: "i2d.mpe.orders.manages1.fragments.OrderSplitDialog",
				controller: this
			});

			var that = this;
			oDialog.then(function (oSource) {
				that._oOrderSplitDialog = oSource;
				that._oParentController = oParams.oParentController;
				oSource.attachEvent("afterClose", $.proxy(function () {
					oSource.destroy();
				}, that));

				oSource.setModel(new JSONModel(oParams.oSelectedOrder), "OrderData");
				oSource.setModel(new JSONModel(oParams.oSelectedOperation), "OperationData");
				oSource.setModel(new JSONModel({
					sSelectedButtonKey: oParams.sSelectedButtonKey,
					sTitle: "",
					isTableSerialNumbersVisible: false,
					aSelectedSerialNumbers: [],
					ValueStateSplitQty: "None",
					ValueStateTextSplitQty: "None",
					ValueStateReworkQty: "None",
					ValueStateTextReworkQty: "None",
					SplitQty: "",
					ReworkQty: "",
					WBSElementIsEditable: false,
					OrderTypeIsEditable: false,
					dialogBusy: true,
					OrderHasParallelSequence: false,
					OrderHasReworkOperation: false,
					OrderTypeValueState: "None",
					ValueStateBasicSchedulingType: "None",
					ValueStateMaterialChild: "None",
					isPMMOActive: false,
					ChildOrder: "",
					ValueStateByProduct: "None"
				}), "OrderSplit");
				oSource.setModel(oParams.oi18nModel, "i18n");

				switch (oParams.sSelectedButtonKey) {
				case "SPLT_DP":
					var sTitle = oParams.oi18nModel.getResourceBundle().getText("splitOrderTitleDiffMat", [oParams.oSelectedOrder.ManufacturingOrder]);
					break;
				case "SPLT_SP":
					sTitle = oParams.oi18nModel.getResourceBundle().getText("splitOrderTitleSameMat", [oParams.oSelectedOrder.ManufacturingOrder]);
					break;
				case "SPLT_OS":
					sTitle = oParams.oi18nModel.getResourceBundle().getText("splitOrderTitleWarehouse", [oParams.oSelectedOrder.ManufacturingOrder]);
					break;
				}
				oSource.getModel("OrderSplit").setProperty("/sTitle", sTitle);

				oSource.setModel(oParams.oDataModel);

				oSource.open();

				Promise.all([

					//Get Split Customizing based on Plant
					new Promise(function (resolve) {
						oParams.oDataModel.read("/I_ProjMfgOrdTypePlntSplitSttg", {
							filters: [new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oParams.oSelectedOrder.ProductionPlant)],
							success: function (oData) {
								resolve(oData.results);
							},
							error: function (error) {
								resolve([]);
								jQuery.sap.log.error(error);
							}
						});
					}),

					//Check if Order has Rework Operation or a parallel sequence
					new Promise(function (resolve) {
						var sPath = oParams.oDataModel.createKey("/I_MfgOrderForSplitInfo", {
							ManufacturingOrder: oParams.oSelectedOrder.ManufacturingOrder
						});

						oParams.oDataModel.read("/" + sPath, {
							success: function (oData) {
								resolve(oData);
							},
							error: function (error) {
								resolve({});
								jQuery.sap.log.error(error);
							}
						});
					}),

					//Check if PMMO scenario is active
					new Promise(function (resolve) {
						oParams.oDataModel.callFunction("/C_ManageProductionOrderCheckpmmoactive", {
							method: "POST",
							success: function (oData) {
								resolve(oData);
							},
							error: function (error) {
								resolve({});
								jQuery.sap.log.error(error);
							}

						});
					})

				]).then(function (oPromiseParams) {

					var oOrderSplitModel = that._oOrderSplitDialog.getModel("OrderSplit");

					//First oData call to check Split Customizing
					//If specific order type settings are available then apply those
					//If specific order type settings are NOT available, then look for plant level settings (with order type as blank)
					//If no matching entry exists, then by default WBS and Order type are editable
					var aOrdTypePlntSplitSttg = oPromiseParams[0];
					if (aOrdTypePlntSplitSttg.length > 0) {
						var bCustFound = false;
						for (var i = 0; i < aOrdTypePlntSplitSttg.length; i++) {
							if (aOrdTypePlntSplitSttg[i].OrderType === oParams.oSelectedOrder.ManufacturingOrderType) {
								bCustFound = true;
								oOrderSplitModel.setProperty("/WBSElementIsEditable", aOrdTypePlntSplitSttg[i].WBSElementIsEditable);
								oOrderSplitModel.setProperty("/OrderTypeIsEditable", aOrdTypePlntSplitSttg[i].OrderTypeIsEditable);
								break;
							}
						}

						if (!bCustFound) {
							for (i = 0; i < aOrdTypePlntSplitSttg.length; i++) {
								if (aOrdTypePlntSplitSttg[i].OrderType === "") {
									oOrderSplitModel.setProperty("/WBSElementIsEditable", aOrdTypePlntSplitSttg[i].WBSElementIsEditable);
									oOrderSplitModel.setProperty("/OrderTypeIsEditable", aOrdTypePlntSplitSttg[i].OrderTypeIsEditable);
									break;
								}
							}
						}

						//Set the default order type value same as selected order's type
						if (oOrderSplitModel.getProperty("/OrderTypeIsEditable")) {
							sap.ui.getCore().byId("idOSManufacturingOrderType").setValue(oParams.oSelectedOrder.ManufacturingOrderType);
						}
					}

					//Second oData call result from I_MfgOrderForSplitInfo for order details
					oOrderSplitModel.setProperty("/OrderHasParallelSequence", oPromiseParams[1].OrderHasParallelSequence);
					oOrderSplitModel.setProperty("/OrderHasReworkOperation", oPromiseParams[1].OrderHasReworkOperation);

					//Third oData call result to check PMMO scenario
					oOrderSplitModel.setProperty("/isPMMOActive", oPromiseParams[2].C_ManageProductionOrderCheckpmmoactive.Active === "X");

					//Set the default scheduling type same as the selected order schedluing type
					sap.ui.getCore().byId("idOSBasicSchedulingType").setValue(oParams.oSelectedOrder.BasicSchedulingType);

					oOrderSplitModel.setProperty("/dialogBusy", false);

				});

			});
		},

		//Add filters for Operation Key to fetch serial numbers
		onBeforeRebindTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			var oOrderData = oEvent.getSource().getModel("OrderData").getData();
			var oOperationData = oEvent.getSource().getModel("OperationData").getData();
			oBindingParams.filters.push(new sap.ui.model.Filter({
				filters: [new Filter("OrderInternalID", sap.ui.model.FilterOperator.EQ, oOrderData.OrderInternalBillOfOperations),
					new Filter("OrderOperationInternalID", sap.ui.model.FilterOperator.EQ, oOperationData.OrderIntBillOfOperationsItem)
				],
				and: true
			}));
			oBindingParams.events = {
				"dataReceived": function (oEventDR) {
					if (oEventDR.getParameter("data").results.length > 0) {
						this._oOrderSplitDialog.getModel("OrderSplit").setProperty("/isTableSerialNumbersVisible", true);

					} else {
						this._oOrderSplitDialog.getModel("OrderSplit").setProperty("/isTableSerialNumbersVisible", false);
					}
				}.bind(this)
			};
		},

		onSelectionChangeSerialNumberTable: function (oEvent) {
			var aSelectedItems = oEvent.getSource().getSelectedItems();
			var aSelectedSerialNumbers = [];
			if (aSelectedItems.length > 0) {
				for (var i = 0; i < aSelectedItems.length; i++) {
					aSelectedSerialNumbers.push(aSelectedItems[i].getBindingContext().getObject().SerialNumber);
				}
				oEvent.getSource().getModel("OrderSplit").setProperty("/aSelectedSerialNumbers", aSelectedSerialNumbers);
			} else {
				oEvent.getSource().getModel("OrderSplit").setProperty("/aSelectedSerialNumbers", []);
			}
		},

		onOk: function (oEvent) {
			if (this._isValidationDone()) {

				oEvent.getSource().getModel("OrderSplit").setProperty("/dialogBusy", true);

				var oOrderData = oEvent.getSource().getModel("OrderData").getData();
				var oOperationData = oEvent.getSource().getModel("OperationData").getData();
				var oOrderSplitData = oEvent.getSource().getModel("OrderSplit").getData();

				var sSerialNumbers = "";
				if (oOrderSplitData.isTableSerialNumbersVisible) {
					sSerialNumbers = oOrderSplitData.aSelectedSerialNumbers.join("|||");
				}
				var that = this;

				var oURLParameters = {
					ManufacturingOrder: oOrderData.ManufacturingOrder,
					ManufacturingOrderOperation: oOperationData.ManufacturingOrderOperation,
					WBSElement: oOrderSplitData.WBSElementIsEditable ? sap.ui.getCore().byId("idOSWBSElementInputChild").getValue() : "",
					SalesDocument: oOrderData.SalesDocument === "" ? sap.ui.getCore().byId("idOSSalesDocument").getValue() : oOrderData.SalesDocument,
					SalesDocumentItem: oOrderData.SalesDocumentItem === "000000" ? sap.ui.getCore().byId("idOSSalesDocumenttem").getValue() : oOrderData
						.SalesDocumentItem,
					ManufacturingOrderType: oOrderSplitData.OrderTypeIsEditable ? sap.ui.getCore().byId("idOSManufacturingOrderType").getValue() : "",
					Mfgorderbasictartdate: sap.ui.getCore().byId("idOSBasicStartDate").getValue(),
					Mfgorderbasicenddate: sap.ui.getCore().byId("idOSBasicEndDate").getValue(),
					BasicSchedulingType: sap.ui.getCore().byId("idOSBasicSchedulingType").getValue(),
					Splitquantity: oOrderSplitData.isTableSerialNumbersVisible ? 0 : Number(oOrderSplitData.SplitQty),
					Reworkquantity: oOrderSplitData.isTableSerialNumbersVisible || oOrderSplitData.OrderHasReworkOperation === "" ? 0 : oOrderSplitData
						.ReworkQty,
					Operationunit: oOrderData.ProductionUnit,
					Byproduct: sap.ui.getCore().byId("idOSByProduct").getValue(),
					Storagelocation: sap.ui.getCore().byId("idOSStorageLocation").getValue(),
					Childmanufacturingorder: oOrderSplitData.ChildOrder,
					Splitmethod: oOrderSplitData.sSelectedButtonKey,
					Material: oOrderSplitData.sSelectedButtonKey === "SPLT_DP" ? sap.ui.getCore().byId("idOSMaterialChildSF").getValue() : oOrderData
						.Material,
					Serialnumbers: sSerialNumbers
				};

				this._oOrderSplitDialog.getModel().callFunction("/C_ManageProductionOrderSplitorder", {

					method: "POST",
					urlParameters: oURLParameters,
					success: function (oData, oResponse) {
						that._oOrderSplitDialog.getModel().refresh();
						that._oOrderSplitDialog.getModel("OrderSplit").setProperty("/dialogBusy", false);
						that._oOrderSplitDialog.close();
						MessageBox.success(that._oOrderSplitDialog.getModel("i18n").getResourceBundle().getText("splitSuccess"), {
							id: "splitSuccessMessageBox",
							actions: [that._oOrderSplitDialog.getModel("i18n").getResourceBundle().getText("displayRelatedOrdersButton"), MessageBox.Action
								.CLOSE
							],
							onClose: function (sAction) {
								if (sAction === that._oOrderSplitDialog.getModel("i18n").getResourceBundle().getText("displayRelatedOrdersButton")) {
									that._oParentController.onPressDisplayRelatedOrders();
								}
							}
						});

					},
					error: function (oError) {
						that._oOrderSplitDialog.getModel("OrderSplit").setProperty("/dialogBusy", false);
						// try {
						// 	//if there is a parsing error, catch error message and show technical service error
						// 	//Show Message Box
						// 	var oResponse = JSON.parse(oError.responseText);
						// 	MessageBox.error(oResponse.error.message.value);
						// } catch (err) {
						// 	MessageBox.error(
						// 		that._oOrderSplitDialog.getModel("i18n").getResourceBundle().getText("ErrorPopupTitle"), {
						// 			id: "splitErrorMessageBox",
						// 			details: oError.response,
						// 			actions: [MessageBox.Action.CLOSE]
						// 		}
						// 	);
						// }
					}
				});
			}
		},

		_isValidationDone: function () {
			var oOrderSplitModel = this._oOrderSplitDialog.getModel("OrderSplit");
			var oOperationDataModel = this._oOrderSplitDialog.getModel("OperationData");

			var bValidationSuccess = true;

			//Check if Order has a Rework Operation then do validation for rework quantity field
			if (oOrderSplitModel.getProperty("/OrderHasReworkOperation") === "X") {
				if (oOrderSplitModel.getProperty("/ReworkQty") === "" || oOrderSplitModel.getProperty("/ReworkQty") <= 0) {
					oOrderSplitModel.setProperty("/ValueStateReworkQty", "Error");
					bValidationSuccess = false;
				} else {
					oOrderSplitModel.setProperty("/ValueStateReworkQty", "None");
				}
			}

			//Check Split Quantity (only if serial numbers not available and split not done to Warehouse)
			if (oOrderSplitModel.getProperty("/isTableSerialNumbersVisible") === false &&
				oOrderSplitModel.getProperty("/sSelectedButtonKey") !== "SPLT_OS") {
				var iSplitQty = oOrderSplitModel.getProperty("/SplitQty");
				if (iSplitQty === "" || iSplitQty <= 0 || iSplitQty >= Number(oOperationDataModel.getProperty("/OpPlannedTotalQuantity"))) {
					oOrderSplitModel.setProperty("/ValueStateSplitQty", "Error");
					bValidationSuccess = false;
				} else {
					oOrderSplitModel.setProperty("/ValueStateSplitQty", "None");
				}
			}

			//If Order type is editable then it's mandatory
			if (oOrderSplitModel.getProperty("/OrderTypeIsEditable")) {
				if (sap.ui.getCore().byId("idOSManufacturingOrderType").getValue() === "") {
					oOrderSplitModel.setProperty("/OrderTypeValueState", "Error");
					bValidationSuccess = false;
				} else {
					oOrderSplitModel.setProperty("/OrderTypeValueState", "None");
				}
			}

			//If Scheduling Type is specified
			if (sap.ui.getCore().byId("idOSBasicSchedulingType").getValue() === "") {
				oOrderSplitModel.setProperty("/ValueStateBasicSchedulingType", "Error");
				bValidationSuccess = false;
			} else {
				oOrderSplitModel.setProperty("/ValueStateBasicSchedulingType", "None");
			}

			//If split is for different material, then material is mandatory
			if (oOrderSplitModel.getProperty("/sSelectedButtonKey") === "SPLT_DP") {
				if (sap.ui.getCore().byId("idOSMaterialChildSF").getValue() === "") {
					bValidationSuccess = false;
					oOrderSplitModel.setProperty("/ValueStateMaterialChild", "Error");
				} else {
					oOrderSplitModel.setProperty("/ValueStateMaterialChild", "None");
				}
			}

			//If PMMO scenario is not active then ByProduct is mandatory
			if (oOrderSplitModel.getProperty("/isPMMOActive") === false) {
				if (sap.ui.getCore().byId("idOSByProduct").getValue() === "") {
					bValidationSuccess = false;
					oOrderSplitModel.setProperty("/ValueStateByProduct", "Error");
				} else {
					oOrderSplitModel.setProperty("/ValueStateByProduct", "None");
				}
			}
			return bValidationSuccess;
		},

		onCancel: function (oEvent) {
			this._oOrderSplitDialog.close();
		},

		onLiveChangeSplitQty: function (oEvent) {
			if (oEvent.getParameters().newValue !== "" &&
				oEvent.getParameters().newValue !== "0" &&
				oEvent.getParameters().newValue >= Number(oEvent.getSource().getModel("OperationData").getProperty("/OpPlannedTotalQuantity"))) {
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateSplitQty", "Error");
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateTextSplitQty", oEvent.getSource().getModel("i18n").getResourceBundle()
					.getText("splitQtyMoreOpQty"));
			} else {
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateSplitQty", "None");
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateTextSplitQty", "");
			}
		},

		onLiveChangeReworkQty: function (oEvent) {
			if (oEvent.getParameters().newValue !== "" &&
				oEvent.getParameters().newValue !== "0" &&
				oEvent.getParameters().newValue > Number(oEvent.getSource().getModel("OrderSplit").getProperty("/SplitQty"))) {
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateReworkQty", "Error");
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateTextReworkQty", oEvent.getSource().getModel("i18n").getResourceBundle()
					.getText("reworkQtyMoreSplitQty"));
			} else {
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateReworkQty", "None");
				oEvent.getSource().getModel("OrderSplit").setProperty("/ValueStateTextReworkQty", "");
			}
		}
	};
});