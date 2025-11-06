# Instructor Invitation System - Schema Design

## Overview
This document outlines the schema design for the instructor invitation system, allowing instructors to invite other instructors to collaborate on courses together.

## 1. Instructor Invitation Schema

### New Schema File: `eLearningAdmin/src/api/instructor-invitation/content-types/instructor-invitation/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "instructor_invitations",
  "info": {
    "singularName": "instructor-invitation",
    "pluralName": "instructor-invitations",
    "displayName": "Instructor Invitation"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "from_instructor": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::instructor.instructor",
      "required": true,
      "description": "The instructor sending the invitation"
    },
    "to_instructor": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::instructor.instructor",
      "required": true,
      "description": "The instructor receiving the invitation"
    },
    "status": {
      "type": "enumeration",
      "enum": ["pending", "accepted", "rejected", "cancelled"],
      "default": "pending",
      "required": true,
      "description": "Status of the invitation"
    },
    "message": {
      "type": "text",
      "description": "Optional message from the sender"
    },
    "invited_at": {
      "type": "datetime",
      "description": "When the invitation was sent"
    },
    "responded_at": {
      "type": "datetime",
      "description": "When the invitation was accepted/rejected"
    },
    "course_context": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::course-course.course-course",
      "description": "Optional: Specific course context for the invitation"
    },
    "read": {
      "type": "boolean",
      "default": false,
      "description": "Whether the recipient has read the invitation"
    }
  }
}
```

## 2. Instructor Groups Schema (for collaboration)

### New Schema File: `eLearningAdmin/src/api/instructor-group/content-types/instructor-group/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "instructor_groups",
  "info": {
    "singularName": "instructor-group",
    "pluralName": "instructor-groups",
    "displayName": "Instructor Group"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "description": "Group name"
    },
    "owner": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::instructor.instructor",
      "required": true,
      "description": "The owner/creator of the group"
    },
    "instructors": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::instructor.instructor",
      "mappedBy": "groups",
      "description": "All instructors in this group"
    },
    "created_at": {
      "type": "datetime"
    }
  }
}
```

## 3. Course-Instructor Relations Schema Update

### Update: `eLearningAdmin/src/api/course-course/content-types/course-course/schema.json`

Note: The course content type is `api::course-course.course-course`. The instructor relation already exists in the schema. If you want to support multiple instructors per course, you can add a many-to-many relation or update the existing instructor relation to support multiple instructors.

## 4. Instructor Schema Update

### Update: `eLearningAdmin/src/api/instructor/content-types/instructor/schema.json`

Add relations:

```json
{
  "groups": {
    "type": "relation",
    "relation": "manyToMany",
    "target": "api::instructor-group.instructor-group",
    "inversedBy": "instructors"
  },
  "courses": {
    "type": "relation",
    "relation": "manyToMany",
    "target": "api::course.course",
    "inversedBy": "instructors"
  },
  "sent_invitations": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::instructor-invitation.instructor-invitation",
    "mappedBy": "from_instructor"
  },
  "received_invitations": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::instructor-invitation.instructor-invitation",
    "mappedBy": "to_instructor"
  }
}
```

## 5. Notification System Integration

### Use Existing Notification System or Create New

If you have a notification system, extend it:

```json
{
  "type": {
    "type": "enumeration",
    "enum": ["invitation_sent", "invitation_received", "invitation_accepted", "invitation_rejected"]
  },
  "instructor_invitation": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::instructor-invitation.instructor-invitation"
  }
}
```

## API Endpoints Needed

1. `POST /api/instructor-invitations` - Send invitation
2. `GET /api/instructor-invitations` - Get invitations (filtered by status)
3. `PUT /api/instructor-invitations/:id` - Accept/Reject invitation
4. `DELETE /api/instructor-invitations/:id` - Cancel invitation
5. `GET /api/instructors/search?q=username` - Search instructors by username
6. `GET /api/instructors/:id/invitations` - Get all invitations for an instructor

## Flow Diagram

```
1. Instructor A searches for Instructor B
2. Instructor A sends invitation to Instructor B
3. Notification created for Instructor B
4. Instructor B receives notification
5. Instructor B views invitation details
6. Instructor B accepts/rejects
7. If accepted: Both instructors added to group/course collaboration
8. If rejected: Invitation marked as rejected
```

## Database Relations

```
Instructor (1) ──< (Many) InstructorInvitation (Many) >── (1) Instructor
     │                                                           │
     │                                                           │
     └──────────────────< (Many) InstructorGroup >──────────────┘
                                │
                                │
                         (Many) Course
```

