# Forum Schema Extensions Required in Strapi

## Current Schema Analysis
The current `forum-forum` schema only has:
- `name` (string)
- `description` (richtext)
- `forum_tags` (relation to forum-tag)
- `liked` (integer)
- `dislike` (integer)
- `viewers` (relation to users)

## Required Extensions for `forum-forum` Content Type

### 1. Core Post Fields
- **`title`** (string, required) - The post title
- **`content`** (richtext, required) - The post content/body
- **`author`** (relation, oneToOne, target: `plugin::users-permissions.user`, required) - Post author
- **`category`** (string or enum) - Post category (e.g., "general", "courses", "technical", "projects", "career", "announcements")
- **`status`** (enum: "draft", "published", "archived", "closed") - Post status for filtering
- **`isPinned`** (boolean, default: false) - Pin important posts
- **`isAnswered`** (boolean, default: false) - Mark if post has accepted answer

### 2. Engagement Metrics
- **`views`** (integer, default: 0) - View count
- **`repliesCount`** (integer, default: 0) - Number of comments/replies
- **`lastActivity`** (datetime) - Last activity timestamp (auto-updated)

### 3. User Interactions (Optional - can be computed from relations)
- **`likes`** (integer, default: 0) - Like count (or use relation)
- **`dislikes`** (integer, default: 0) - Dislike count (or use relation)
- **`likedBy`** (relation, manyToMany, target: `plugin::users-permissions.user`) - Users who liked
- **`dislikedBy`** (relation, manyToMany, target: `plugin::users-permissions.user`) - Users who disliked
- **`bookmarkedBy`** (relation, manyToMany, target: `plugin::users-permissions.user`) - Users who bookmarked

### 4. Relations
- **`comments`** (relation, oneToMany, target: `api::forum-comment.forum-comment`) - Post comments
- **`forum_tags`** (already exists) - Keep existing relation

### 5. Metadata
- Keep existing `createdAt`, `updatedAt`, `publishedAt` from Strapi timestamps

## New Content Type Required: `forum-comment`

Create a new content type `forum-comment` with:
- **`content`** (richtext, required) - Comment content
- **`author`** (relation, oneToOne, target: `plugin::users-permissions.user`, required) - Comment author
- **`forumPost`** (relation, manyToOne, target: `api::forum-forum.forum-forum`, required) - Parent post
- **`parentComment`** (relation, manyToOne, target: `api::forum-comment.forum-comment`, optional) - For nested replies
- **`likes`** (integer, default: 0) - Like count
- **`dislikes`** (integer, default: 0) - Dislike count
- **`likedBy`** (relation, manyToMany, target: `plugin::users-permissions.user`) - Users who liked
- **`dislikedBy`** (relation, manyToMany, target: `plugin::users-permissions.user`) - Users who disliked
- **`replies`** (relation, oneToMany, target: `api::forum-comment.forum-comment`) - Nested replies
- Timestamps: `createdAt`, `updatedAt`

## New Content Type Required: `forum-category` (Optional)

Alternatively, use enum for category. If you want dynamic categories:
- **`name`** (string, required, unique)
- **`description`** (text)
- **`color`** (string) - For UI display
- **`slug`** (string, unique) - URL-friendly identifier

## Summary

**Minimum Required Fields to Add:**
1. `title` (string, required)
2. `content` (richtext, required)
3. `author` (relation to user, required)
4. `category` (string/enum)
5. `status` (enum: draft, published, archived, closed)
6. `isPinned` (boolean)
7. `isAnswered` (boolean)
8. `views` (integer)
9. `repliesCount` (integer)
10. `lastActivity` (datetime)
11. `comments` (relation to forum-comment)

**New Content Type to Create:**
- `forum-comment` (for comments/replies)

**Optional Enhancements:**
- `forum-category` content type (if you want dynamic categories)
- User interaction relations (likedBy, dislikedBy, bookmarkedBy)

