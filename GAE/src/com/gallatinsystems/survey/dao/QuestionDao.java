package com.gallatinsystems.survey.dao;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.logging.Level;

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.NotPersistent;

import org.waterforpeople.mapping.dao.QuestionAnswerStoreDao;

import com.gallatinsystems.framework.dao.BaseDAO;
import com.gallatinsystems.framework.exceptions.IllegalDeletionException;
import com.gallatinsystems.framework.servlet.PersistenceFilter;
import com.gallatinsystems.survey.domain.Question;
import com.gallatinsystems.survey.domain.QuestionGroup;
import com.gallatinsystems.survey.domain.QuestionHelpMedia;
import com.gallatinsystems.survey.domain.QuestionOption;
import com.gallatinsystems.survey.domain.Translation;
import com.gallatinsystems.survey.domain.Translation.ParentType;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Transaction;

public class QuestionDao extends BaseDAO<Question> {

	private QuestionOptionDao optionDao;
	private QuestionHelpMediaDao helpDao;
	private TranslationDao translationDao;
	private ScoringRuleDao scoringRuleDao;

	public QuestionDao() {
		super(Question.class);
		optionDao = new QuestionOptionDao();
		helpDao = new QuestionHelpMediaDao();
		translationDao = new TranslationDao();
		scoringRuleDao = new ScoringRuleDao();
	}

	public List<Question> listQuestionByType(Long surveyId, Question.Type type) {
		if (surveyId == null) {
			return listByProperty("type", type.toString(), "String", "order",
					"asc");
		} else {
			List<Question> allQuestionsInOrder = listQuestionInOrder(surveyId);
			List<Question> typeQuestions = new ArrayList<Question>();
			if (type != null) {
				if (allQuestionsInOrder != null) {
					for (Question q : allQuestionsInOrder) {
						if (type.equals(q.getType())) {
							typeQuestions.add(q);
						}
					}
					return typeQuestions;
				}
			}
			return allQuestionsInOrder;
		}
	}

	/**
	 * loads the Question object but NOT any associated options
	 * 
	 * @param id
	 * @return
	 */
	public Question getQuestionHeader(Long id) {
		return getByKey(id);

	}

	/**
	 * lists minimal question information by surveyId
	 * 
	 * @param surveyId
	 * @return
	 */
	public List<Question> listQuestionsBySurvey(Long surveyId) {
		return listByProperty("surveyId", surveyId, "Long", "order", "asc");
	}

	public void delete(Question question) throws IllegalDeletionException {
		QuestionAnswerStoreDao qasDao = new QuestionAnswerStoreDao();
		if (qasDao.listByQuestion(question.getKey().getId()).size() == 0) {
			for (Map.Entry<Integer, QuestionOption> qoItem : optionDao
					.listOptionByQuestion(question.getKey().getId()).entrySet()) {
				SurveyTaskUtil.spawnDeleteTask("deleteQuestionOptions", qoItem
						.getValue().getKey().getId());
			}
			TranslationDao tDao = new TranslationDao();
			tDao.deleteTranslationsForParent(question.getKey().getId(),
					Translation.ParentType.QUESTION_TEXT);
			// TODO:Implement help media delete
			Question q = getByKey(question.getKey());
			if (q != null) {
				int order = q.getOrder();
				Long groupId = q.getQuestionGroupId();
				super.delete(q);
				// now adjust other orders
				TreeMap<Integer, Question> groupQs = listQuestionsByQuestionGroup(
						groupId, false);
				if (groupQs != null) {
					for (Question gq : groupQs.values()) {
						if (gq.getOrder() >= order) {
							gq.setOrder(gq.getOrder() - 1);
						}
					}
				}
			}
		} else {
			throw new IllegalDeletionException(
					"Cannot delete questionId: "
							+ question.getKey().getId()
							+ " surveyCode:"
							+ question.getText()
							+ " because there is a QuestionAnswerStore value for this question. Please delete all survey response first");
		}

	}

	public List<Question> listQuestionInOrder(Long surveyId) {
		List<Question> orderedQuestionList = new ArrayList<Question>();
		List<Question> unknownOrder = listByProperty("surveyId", surveyId,
				"Long", "order", "asc");
		QuestionGroupDao qgDao = new QuestionGroupDao();

		List<QuestionGroup> qgList = qgDao.listQuestionGroupBySurvey(surveyId);
		for (QuestionGroup qg : qgList) {
			for (Question q : unknownOrder) {
				if (qg.getKey().getId() == q.getQuestionGroupId()) {
					orderedQuestionList.add(q);
				}
			}
		}
		return orderedQuestionList;
	}

	public Question saveTransactional(Question q) {
		DatastoreService datastore = DatastoreServiceFactory
				.getDatastoreService();
		Transaction txn = datastore.beginTransaction();
		Entity question = null;
		try {
			if (q.getKey() != null) {
				question = datastore.get(q.getKey());
			} else {
				question = new Entity("Question");
			}

			Field[] f = Question.class.getDeclaredFields();
			for (int i = 0; i < f.length; i++) {
				if (!"key".equals(f[i].getName())
						&& f[i].getAnnotation(NotPersistent.class) == null
						&& !"type".equals(f[i].getName())
						&& !f[i].getName().startsWith("jdo")
						&& !f[i].getName().equals("serialVersionUID")) {
					f[i].setAccessible(true);
					question.setProperty(f[i].getName(), f[i].get(q));
				}
			}
			// now set the type
			question.setProperty("type", q.getType().toString());
		} catch (Exception e) {
			log.log(Level.SEVERE, "Could not set entity fields", e);
		}

		Key key = datastore.put(question);
		q.setKey(key);
		txn.commit();
		return q;
	}

	public Question save(Question question, Long questionGroupId) {
		if (questionGroupId != null) {
			question.setQuestionGroupId(questionGroupId);
			QuestionGroup group = getByKey(questionGroupId, QuestionGroup.class);
			if (group != null) {
				question.setSurveyId(group.getSurveyId());
			}
		}
		question = saveTransactional(question);
		// delete existing options

		QuestionOptionDao qoDao = new QuestionOptionDao();
		TreeMap<Integer, QuestionOption> qoMap = qoDao
				.listOptionByQuestion(question.getKey().getId());
		if (qoMap != null) {
			for (Map.Entry<Integer, QuestionOption> entry : qoMap.entrySet()) {
				qoDao.delete(entry.getValue());
			}
		}
		if (question.getQuestionOptionMap() != null) {
			for (QuestionOption opt : question.getQuestionOptionMap().values()) {
				opt.setQuestionId(question.getKey().getId());
				if (opt.getText() != null && opt.getText().contains(",")) {
					opt.setText(opt.getText().replaceAll(",", "-"));
					if (opt.getCode() != null) {
						opt.setCode(opt.getCode().replaceAll(",", "-"));
					}
				}
				save(opt);
				if (opt.getTranslationMap() != null) {
					for (Translation t : opt.getTranslationMap().values()) {
						if (t.getParentId() == null) {
							t.setParentId(opt.getKey().getId());
						}
					}
					save(opt.getTranslationMap().values());
				}
			}
		}
		if (question.getTranslationMap() != null) {
			for (Translation t : question.getTranslationMap().values()) {
				if (t.getParentId() == null) {
					t.setParentId(question.getKey().getId());
				}
			}
			save(question.getTranslationMap().values());
		}

		if (question.getQuestionHelpMediaMap() != null) {
			for (QuestionHelpMedia help : question.getQuestionHelpMediaMap()
					.values()) {
				help.setQuestionId(question.getKey().getId());

				save(help);
				if (help.getTranslationMap() != null) {
					for (Translation t : help.getTranslationMap().values()) {
						if (t.getParentId() == null) {
							t.setParentId(help.getKey().getId());
						}
					}
					save(help.getTranslationMap().values());
				}
			}
		}
		return question;
	}

	public Question findByReferenceId(String refid) {
		Question q = findByProperty("referenceIndex", refid, "String");
		return q;
	}

	public Question getByKey(Long id, boolean needDetails) {
		Question q = getByKey(id);
		if (needDetails) {
			q.setQuestionHelpMediaMap(helpDao.listHelpByQuestion(q.getKey()
					.getId()));
			if (Question.Type.OPTION == q.getType()) {
				q.setQuestionOptionMap(optionDao.listOptionByQuestion(q
						.getKey().getId()));
			}
			q.setTranslationMap(translationDao.findTranslations(
					Translation.ParentType.QUESTION_TEXT, q.getKey().getId()));
			// only load scoring rules for types that support scoring
			if (Question.Type.OPTION == q.getType()
					|| Question.Type.FREE_TEXT == q.getType()
					|| Question.Type.NUMBER == q.getType()) {
				q.setScoringRules(scoringRuleDao.listRulesByQuestion(q.getKey()
						.getId()));
			}
		}
		return q;
	}

	public Question getByKey(Key key) {
		return super.getByKey(key);
	}

	public List<Question> listQuestionsByQuestionGroupOrderByCreatedDateTime(
			Long questionGroupId) {
		return listByProperty("questionGroupId", questionGroupId, "Long",
				"createdDateTime", "asc");
	}

	public TreeMap<Integer, Question> listQuestionsByQuestionGroup(
			Long questionGroupId, boolean needDetails) {
		List<Question> qList = listByProperty("questionGroupId",
				questionGroupId, "Long", "order", "asc");
		TreeMap<Integer, Question> map = new TreeMap<Integer, Question>();
		if (qList != null) {
			int i = 1;
			for (Question q : qList) {

				if (needDetails) {
					q.setQuestionHelpMediaMap(helpDao.listHelpByQuestion(q
							.getKey().getId()));
					if (Question.Type.OPTION == q.getType()
							|| Question.Type.STRENGTH == q.getType()) {
						q.setQuestionOptionMap(optionDao.listOptionByQuestion(q
								.getKey().getId()));
					}
					q.setTranslationMap(translationDao.findTranslations(
							ParentType.QUESTION_TEXT, q.getKey().getId()));
					// only load scoring rules for types that support
					// scoring
					if (Question.Type.OPTION == q.getType()
							|| Question.Type.FREE_TEXT == q.getType()
							|| Question.Type.NUMBER == q.getType()) {
						q.setScoringRules(scoringRuleDao.listRulesByQuestion(q
								.getKey().getId()));
					}
				}
				if (q.getOrder() == null) {
					q.setOrder(qList.size() + 1);
					i++;
				} else {
					if (map.size() > 0 && !(q.getOrder() > map.size())) {
						q.setOrder(map.size() + 1);
						super.save(q);
					} else if (map.size() == 0) {
						super.save(q);
					}
				}
				map.put(q.getOrder(), q);
			}
		}
		return map;
	}

	@SuppressWarnings("unchecked")
	public Question getByPath(Integer order, String path) {
		PersistenceManager pm = PersistenceFilter.getManager();
		javax.jdo.Query query = pm.newQuery(Question.class);
		query.setFilter(" path == pathParam && order == orderParam");
		query.declareParameters("String pathParam, String orderParam");
		List<Question> results = (List<Question>) query.execute(path, order);
		if (results != null && results.size() > 0) {
			return results.get(0);
		} else {
			return null;
		}
	}

	@SuppressWarnings("unchecked")
	public Question getByQuestionGroupId(Long questionGroupId,
			String questionText) {
		PersistenceManager pm = PersistenceFilter.getManager();
		javax.jdo.Query query = pm.newQuery(Question.class);
		query.setFilter(" questionGroupId == questionGroupIdParam && text == questionTextParam");
		query.declareParameters("Long questionGroupIdParam, String questionTextParam");
		List<Question> results = (List<Question>) query.execute(
				questionGroupId, questionText);
		if (results != null && results.size() > 0) {
			return results.get(0);
		} else {
			return null;
		}
	}

	@SuppressWarnings("unchecked")
	public Question getByGroupIdAndOrder(Long questionGroupId, Integer order) {
		PersistenceManager pm = PersistenceFilter.getManager();
		javax.jdo.Query query = pm.newQuery(Question.class);
		query.setFilter(" questionGroupId == questionGroupIdParam && order == orderParam");
		query.declareParameters("Long questionGroupIdParam, Integer orderParam");
		List<Question> results = (List<Question>) query.execute(
				questionGroupId, order);
		if (results != null && results.size() > 0) {
			return results.get(0);
		} else {
			return null;
		}
	}

	/**
	 * updates ONLY the order field within the question object for the questions
	 * passed in. All questions must exist in the datastore
	 * 
	 * @param questionList
	 */
	public void updateQuestionOrder(List<Question> questionList) {
		if (questionList != null) {
			for (Question q : questionList) {
				Question persistentQuestion = getByKey(q.getKey());
				persistentQuestion.setOrder(q.getOrder());
				// since the object is still attached, we don't need to call
				// save. It will be saved on flush of the Persistent session
			}
		}
	}

	/**
	 * updates ONLY the order field within the question group object for the
	 * questions passed in. All question groups must exist in the datastore
	 * 
	 * @param questionList
	 */
	public void updateQuestionGroupOrder(List<QuestionGroup> groupList) {
		if (groupList != null) {
			for (QuestionGroup q : groupList) {
				QuestionGroup persistentGroup = getByKey(q.getKey(),
						QuestionGroup.class);
				persistentGroup.setOrder(q.getOrder());
				// since the object is still attached, we don't need to call
				// save. It will be saved on flush of the Persistent session
			}
		}
	}
}
