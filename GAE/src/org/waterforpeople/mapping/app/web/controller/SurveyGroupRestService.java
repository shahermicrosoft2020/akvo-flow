package org.waterforpeople.mapping.app.web.controller;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.waterforpeople.mapping.app.gwt.client.survey.SurveyDto;
import org.waterforpeople.mapping.app.gwt.client.survey.SurveyGroupDto;

import com.gallatinsystems.common.Constants;
import com.gallatinsystems.survey.dao.SurveyGroupDAO;
import com.gallatinsystems.survey.dao.SurveyDAO;
import com.gallatinsystems.survey.domain.Survey;
import com.gallatinsystems.survey.domain.SurveyGroup;
import org.waterforpeople.mapping.app.web.controller.RestStatusDto;

@Controller
@RequestMapping("/survey-group")
public class SurveyGroupRestService {

	@Inject
	private SurveyGroupDAO surveyGroupDao;
	
	@Inject
	private SurveyDAO surveyDao;
	
	// list all survey groups
	@RequestMapping(method = RequestMethod.GET, value = "/")
	@ResponseBody
	public List<SurveyGroupDto> listSurveyGroups() {
		List<SurveyGroupDto> results = new ArrayList<SurveyGroupDto>();
		List<SurveyGroup> surveys = surveyGroupDao.list(Constants.ALL_RESULTS);
		if (surveys != null) {
			for (SurveyGroup s : surveys) {
				SurveyGroupDto dto = new SurveyGroupDto();

				dto.setName(s.getName());
				dto.setCode(s.getCode());
				dto.setDescription(s.getDescription());
				dto.setKeyId(s.getKey().getId());
				results.add(dto);
			}
		}
		return results;
	}
	
	// find survey group by id
	@RequestMapping(method = RequestMethod.GET, value = "/{id}")
	@ResponseBody
	public SurveyGroupDto findSurveyGroupById(@PathVariable("id") Long id){
		SurveyGroup s =surveyGroupDao.getByKey(id);		
		SurveyGroupDto dto = null;
		if(s != null){
			dto = new SurveyGroupDto();
			dto.setName(s.getName());
			dto.setCode(s.getCode());
			dto.setDescription(s.getDescription());
			dto.setKeyId(s.getKey().getId());
		}
		return dto;	
	}
	
	// delete survey group by id
	@RequestMapping(method = RequestMethod.POST, value = "/del/{id}")
	@ResponseBody
	public RestStatusDto deleteSurveyGroupById(@PathVariable("id") Long id){
		SurveyGroup s = surveyGroupDao.getByKey(id);		
		RestStatusDto dto = null;
		dto = new RestStatusDto();
		dto.setStatus("failed");
		  
		// check if surveyGroup exists in the datastore
		if (s != null){
			// only delete surveyGroups if there are no surveys in there
			List<Survey> surveys = surveyDao.listSurveysByGroup(id);
			if (surveys.size() == 0) {
				// delete survey group
				surveyGroupDao.delete(s);
				dto.setStatus("ok");
			}	
		}
		return dto;
	}
	
	// save survey group
	@RequestMapping(method = RequestMethod.POST, value="/")
	@ResponseBody
	public SurveyGroupDto saveSurveyGroup(@RequestBody SurveyGroupDto surveyGroupDto){
		// if the POST data contains a valid surveyGroupDto, continue. Otherwise, server 400 Bad Request 
		if (surveyGroupDto != null){
			Long keyId = surveyGroupDto.getKeyId();
			SurveyGroup s;
			
			// if the surveyGroupDto has a key, try to get the surveyGroup.
			if (keyId != null) {
				s = surveyGroupDao.getByKey(keyId);
				// if the surveyGroup doesn't exist, create a new surveyGroup
				if (s == null) {
					s = new SurveyGroup();
				}
			} else {
				s = new SurveyGroup();
			}
			// copy the properties, except the createdDateTime property, because it is set in the Dao.
			BeanUtils.copyProperties(surveyGroupDto, s, new String[] {"createdDateTime"});
			s = surveyGroupDao.save(s);
			
			// set the generated properties on the surveyGroupDto
			surveyGroupDto.setKeyId(s.getKey().getId());
			surveyGroupDto.setCreatedDateTime(s.getCreatedDateTime());
			surveyGroupDto.setLastUpdateDateTime(s.getLastUpdateDateTime());		
		}
		return surveyGroupDto;
	}
}
