/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
function initModel() {
	var sUrl = "/sap/opu/odata/sap/PP_MPE_ORDER_MANAGE/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}