/*
 *  Copyright (C) 2019 Stichting Akvo (Akvo Foundation)
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

package org.akvo.flow.rest.dto;

import java.io.Serializable;

public class DataPointAssignmentPayload implements Serializable {

    private static final long serialVersionUID = -4133374456777431202L;

    private DataPointAssignmentDto data_point_assignment; //Not camelCaps

    public DataPointAssignmentDto getData_point_assignment() {
        return data_point_assignment;
    }

    public void setData_point_assignment(DataPointAssignmentDto dataPointAssignment) {
        this.data_point_assignment = dataPointAssignment;
    }
}
