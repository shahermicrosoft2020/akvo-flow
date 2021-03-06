/*
 *  Copyright (C) 2010-2016,2018 Stichting Akvo (Akvo Foundation)
 *
 *  This file is part of Akvo FLOW.
 *
 *  Akvo FLOW is free software: you can redistribute it and modify it under the terms of
 *  the GNU Affero General Public License (AGPL) as published by the Free Software Foundation,
 *  either version 3 of the License or any later version.
 *
 *  Akvo FLOW is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 *  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Affero General Public License included below for more details.
 *
 *  The full license text can also be seen at <http://www.gnu.org/licenses/agpl.html>.
 */

package org.waterforpeople.mapping.domain;

import com.gallatinsystems.common.Constants;
import com.gallatinsystems.device.domain.DeviceFiles;
import com.gallatinsystems.framework.domain.BaseDomain;
import com.gallatinsystems.survey.dao.SurveyDAO;
import org.akvo.flow.domain.SecuredObject;
import org.apache.commons.lang.StringUtils;
import javax.jdo.annotations.IdentityType;
import javax.jdo.annotations.NotPersistent;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.gallatinsystems.common.Constants.MAX_LENGTH;

@PersistenceCapable(identityType = IdentityType.APPLICATION)
public class SurveyInstance extends BaseDomain implements SecuredObject {

    private static final long serialVersionUID = 5840846001731305734L;

    @Persistent
    private Long userID;

    @Persistent
    private Date collectionDate;
    private Long deviceFileId;

    @NotPersistent
    private DeviceFiles deviceFile;

    @NotPersistent
    private List<QuestionAnswerStore> questionAnswersStore;

    private Long surveyId;
    private Double formVersion; //What form version was used to collect the data
    
    private String deviceIdentifier;
    private String submitterName;
    private String approvedFlag;
    private String uuid;
    private Long surveyedLocaleId;
    private String surveyedLocaleIdentifier;
    private String surveyedLocaleDisplayName;
    private String countryCode;
    private String community;
    private String localeGeoLocation;

    private Long surveyalTime;

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getCommunity() {
        return community;
    }

    public void setCommunity(String community) {
        this.community = community;
    }


    public Long getSurveyedLocaleId() {
        return surveyedLocaleId;
    }

    public void setSurveyedLocaleId(Long surveyedLocaleId) {
        this.surveyedLocaleId = surveyedLocaleId;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getApprovedFlag() {
        return approvedFlag;
    }

    public void setApprovedFlag(String approvedFlag) {
        this.approvedFlag = approvedFlag;
    }

    public Long getSurveyId() {
        return surveyId;
    }

    public void setSurveyId(Long surveyId) {
        this.surveyId = surveyId;
    }

    public Long getUserID() {
        return userID;
    }

    public void setUserID(Long userID) {
        this.userID = userID;
    }

    public Date getCollectionDate() {
        return collectionDate;
    }

    public void setCollectionDate(Date collectionDate) {
        this.collectionDate = collectionDate;
    }

    public DeviceFiles getDeviceFile() {
        return deviceFile;
    }

    public void setDeviceFile(DeviceFiles deviceFile) {
        this.deviceFile = deviceFile;
        if (deviceFile.getKey() != null)
            deviceFileId = deviceFile.getKey().getId();
    }

    public List<QuestionAnswerStore> getQuestionAnswersStore() {
        return questionAnswersStore;
    }

    public void setQuestionAnswersStore(
            List<QuestionAnswerStore> questionAnswersStore) {
        this.questionAnswersStore = questionAnswersStore;
    }

    public void setSubmitterName(String name) {
        submitterName = name;
    }

    public String getSubmitterName() {
        return submitterName;
    }

    public void setDeviceIdentifier(String id) {
        deviceIdentifier = id;
    }

    public String getDeviceIdentifier() {
        return deviceIdentifier;
    }

    @Override
    public String toString() {
        StringBuilder result = new StringBuilder();
        String newLine = System.getProperty("line.separator");

        result.append(this.getClass().getName());
        result.append(" Object {");
        result.append(newLine);

        // determine fields declared in this class only (no fields of
        // superclass)
        Field[] fields = this.getClass().getDeclaredFields();

        // print field names paired with their values
        for (Field field : fields) {
            result.append("  ");
            try {
                result.append(field.getName());
                result.append(": ");
                // requires access to private field:
                result.append(field.get(this));
            } catch (IllegalAccessException ex) {
                System.out.println(ex);
            }
            result.append(newLine);
        }
        result.append("}");

        return result.toString();
    }

    public void setDeviceFileId(Long deviceFileId) {
        this.deviceFileId = deviceFileId;
    }

    public Long getDeviceFileId() {
        return deviceFileId;
    }

    public void setSurveyalTime(Long survetalTime) {
        this.surveyalTime = survetalTime;
    }

    public Long getSurveyalTime() {
        return surveyalTime;
    }

    public String getSurveyedLocaleIdentifier() {
        return surveyedLocaleIdentifier;
    }

    public void setSurveyedLocaleIdentifier(String surveyedLocaleIdentifier) {
        this.surveyedLocaleIdentifier = surveyedLocaleIdentifier;
    }

    public String getLocaleGeoLocation() {
        return localeGeoLocation;
    }

    public void setLocaleGeoLocation(String localeGeoLocation) {
        this.localeGeoLocation = localeGeoLocation;
    }

    public String getSurveyedLocaleDisplayName() {
        return surveyedLocaleDisplayName;
    }

    public void setSurveyedLocaleDisplayName(String surveyedLocaleDisplayName) {
        this.surveyedLocaleDisplayName = surveyedLocaleDisplayName != null
                && surveyedLocaleDisplayName.length() > MAX_LENGTH
                ? surveyedLocaleDisplayName.substring(0, MAX_LENGTH).trim()
                : surveyedLocaleDisplayName;
    }

    /**
     * Extract geolocation information from a survey instance
     *
     * @return a map containing latitude and longitude entries null if a null string is provided
     */
    public static Map<String, Object> retrieveGeoLocation(
            SurveyInstance surveyInstance) throws NumberFormatException {
        Map<String, Object> geoLocationMap = null;

        // retrieve geo location string
        String geoLocationString = null;
        // if the GEO information was present as Meta data, get it from there
        if (StringUtils.isNotBlank(surveyInstance.getLocaleGeoLocation())) {
            geoLocationString = surveyInstance.getLocaleGeoLocation();
        }

        String[] tokens = StringUtils.split(geoLocationString, "\\|");
        if (tokens != null && tokens.length >= 2) {
            geoLocationMap = new HashMap<>();
            geoLocationMap.put(Constants.LATITUDE, Double.parseDouble(tokens[0]));
            geoLocationMap.put(Constants.LONGITUDE, Double.parseDouble(tokens[1]));
        }

        return geoLocationMap;
    }


    @Override
    public SecuredObject getParentObject() {
        if (surveyId == null) {
            return null;
        }

        return new SurveyDAO().getByKey(surveyId);
    }

    @Override
    public Long getObjectId() {
        if (key == null) {
            return null;
        }
        return key.getId();
    }

    @Override
    public List<Long> listAncestorIds() {
        if (surveyId == null) {
            return Collections.emptyList();
        }

        SecuredObject s = new SurveyDAO().getByKey(surveyId);
        if (s == null) {
            return Collections.emptyList();
        }

        return s.listAncestorIds();
    }

    @Override
    public List<BaseDomain> updateAncestorIds(boolean cascade) {
        // do not update or return any child objects. Survey entities are the leaves
        return Collections.emptyList();
    }

	public Double getFormVersion() {
		return formVersion;
	}

	public void setFormVersion(Double formVersion) {
		this.formVersion = formVersion;
	}
}
