package org.waterforpeople.mapping.app.gwt.client.survey;

import java.util.Date;
import java.util.List;

import com.gallatinsystems.framework.gwt.dto.client.BaseDto;

/**
 * transfer object for the SurveyedLocale domain
 * 
 * @author Christopher Fagiani
 * 
 */
public class SurveyedLocaleDto extends BaseDto {
	private static final long serialVersionUID = -261120063665344559L;
	private String organization;
	private String systemIdentifier;
	private String identifier;
	private String countryCode;
	private String sublevel1;
	private String sublevel2;
	private String sublevel3;
	private String sublevel4;
	private String sublevel5;
	private String sublevel6;
	private String localeType;
	private Double latitude;
	private Double longitude;
	private boolean ambiguous;
	private Date lastSurveyedDate;
	private List<SurveyalValueDto> values;

	public List<SurveyalValueDto> getValues() {
		return values;
	}

	public void setValues(List<SurveyalValueDto> values) {
		this.values = values;
	}

	public String getOrganization() {
		return organization;
	}

	public void setOrganization(String organization) {
		this.organization = organization;
	}

	public String getSystemIdentifier() {
		return systemIdentifier;
	}

	public void setSystemIdentifier(String systemIdentifier) {
		this.systemIdentifier = systemIdentifier;
	}

	public String getIdentifier() {
		return identifier;
	}

	public void setIdentifier(String identifier) {
		this.identifier = identifier;
	}

	public String getCountryCode() {
		return countryCode;
	}

	public void setCountryCode(String countryCode) {
		this.countryCode = countryCode;
	}

	public String getSublevel1() {
		return sublevel1;
	}

	public void setSublevel1(String sublevel1) {
		this.sublevel1 = sublevel1;
	}

	public String getSublevel2() {
		return sublevel2;
	}

	public void setSublevel2(String sublevel2) {
		this.sublevel2 = sublevel2;
	}

	public String getSublevel3() {
		return sublevel3;
	}

	public void setSublevel3(String sublevel3) {
		this.sublevel3 = sublevel3;
	}

	public String getSublevel4() {
		return sublevel4;
	}

	public void setSublevel4(String sublevel4) {
		this.sublevel4 = sublevel4;
	}

	public String getSublevel5() {
		return sublevel5;
	}

	public void setSublevel5(String sublevel5) {
		this.sublevel5 = sublevel5;
	}

	public String getSublevel6() {
		return sublevel6;
	}

	public void setSublevel6(String sublevel6) {
		this.sublevel6 = sublevel6;
	}

	public String getLocaleType() {
		return localeType;
	}

	public void setLocaleType(String localeType) {
		this.localeType = localeType;
	}

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	public boolean isAmbiguous() {
		return ambiguous;
	}

	public void setAmbiguous(boolean ambiguous) {
		this.ambiguous = ambiguous;
	}

	public Date getLastSurveyedDate() {
		return lastSurveyedDate;
	}

	public void setLastSurveyedDate(Date lastSurveyedDate) {
		this.lastSurveyedDate = lastSurveyedDate;
	}

}
