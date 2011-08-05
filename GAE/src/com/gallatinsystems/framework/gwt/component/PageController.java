package com.gallatinsystems.framework.gwt.component;

import java.util.Map;

/**
 * Interface that can be implemented by components that can serve as a master
 * controller, opening and closing other "pages"
 * 
 * @author Christopher Fagiani
 * 
 */
public interface PageController {
	@SuppressWarnings("rawtypes")
	public void openPage(Class clazz, Map<String, Object> bundle);

	@SuppressWarnings("rawtypes")
	public void openPage(Class clazz, boolean isForward,
			Map<String, Object> bundle);

	public void setWorking(boolean isWorking);

	public boolean isWorking();
}
