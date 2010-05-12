package org.waterforpeople.mapping.helper;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.util.ArrayList;
import java.util.TreeMap;
import java.util.Map.Entry;
import java.util.logging.Logger;

import org.waterforpeople.mapping.adapter.SpreadsheetAccessPointAdapter;
import org.waterforpeople.mapping.dao.MappingSpreadsheetDefintionDAO;
import org.waterforpeople.mapping.domain.MappingSpreadsheetDefinition;

import com.gallatinsystems.common.util.ClassAttributeUtil;
import com.google.gdata.util.ServiceException;

public class SpreadsheetMappingAttributeHelper {
	private static final Logger log = Logger
			.getLogger(SpreadsheetMappingAttributeHelper.class.getName());

	private String sessionToken = null;
	private PrivateKey privateKey = null;

	public SpreadsheetMappingAttributeHelper(String sessionToken,
			PrivateKey privateKey) {
		this.sessionToken = sessionToken;
		this.privateKey = privateKey;
	}

	public MappingSpreadsheetDefinition saveSpreadsheetMappingAttribute(
			MappingSpreadsheetDefinition mapDef) {
		return null;
	}

	public ArrayList<String> processSpreadsheet(
			MappingSpreadsheetDefinition mapDef) throws IOException,
			ServiceException {
		String spreadsheetName = mapDef.getSpreadsheetURL();
		if (!spreadsheetName.trim().isEmpty()) {
			SpreadsheetAccessPointAdapter sapa = new SpreadsheetAccessPointAdapter(
					sessionToken, privateKey);
			sapa.processSpreadsheetOfAccessPoints(spreadsheetName);
			// ToDo: need to decide how to let them know this is finished since
			// it could take a while
			// need to think about how to manage errors as well.
		}

		return null;
	}

	public static ArrayList<String> listObjectAttributes() {
		TreeMap<String, String> attributes = ClassAttributeUtil
				.listObjectAttributes("org.waterforpeople.mapping.domain.AccessPoint");
		ArrayList<String> attributesList = new ArrayList<String>();
		for (Entry<String, String> item : attributes.entrySet())
			attributesList.add(item.getKey());
		return attributesList;
	}

	public ArrayList<String> listSpreadsheetColumns(String spreadsheetName)
			throws IOException, ServiceException {
		if (!spreadsheetName.trim().isEmpty()) {
			SpreadsheetAccessPointAdapter sapa = new SpreadsheetAccessPointAdapter(
					sessionToken, privateKey);
			return sapa.listColumns(spreadsheetName);
		}
		return null;
	}

	public ArrayList<String> listSpreadsheets() {
		// TODO Auto-generated method stub
		return null;
	}

	public MappingSpreadsheetDefinition saveSpreadsheetMapping(
			MappingSpreadsheetDefinition mapDef) {
		MappingSpreadsheetDefintionDAO baseDAO = new MappingSpreadsheetDefintionDAO(
				MappingSpreadsheetDefinition.class);
		return baseDAO.save(mapDef);
	}

	public ArrayList<String> listSpreadsheets(String feedURL)
			throws IOException, ServiceException, GeneralSecurityException {
		return new SpreadsheetAccessPointAdapter(sessionToken, privateKey)
				.listSpreadsheets(feedURL);
	}

	public MappingSpreadsheetDefinition getMappingSpreadsheetDefinition(
			String spreadsheetName) {
		MappingSpreadsheetDefintionDAO baseDAO = new MappingSpreadsheetDefintionDAO(
				MappingSpreadsheetDefinition.class);
		return baseDAO.findBySpreadsheetURL(spreadsheetName);
	}
}
