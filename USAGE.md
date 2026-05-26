# InsureIQ Usage Guide

Welcome to InsureIQ! This guide provides an overview of how to interact with the dashboard, manage insurance workflows, and manage the system.

## 1. User Roles

The system inherently categorizes users into two environments:
* **Standard User (Customer)**: This user sees only their own policies, can submit new claims for themselves, and is presented with a personalized dashboard detailing their analytics.
* **Admin User (Employee/Manager)**: Possesses global visibility. Admins can view all policies across the platform, manage existing users, approve or reject claims, and view comprehensive, system-wide analytics.

## 2. Managing Policies

Policies represent active insurance contracts an individual holds.
* **Navigation**: Click the **Policies** tab on the left sidebar.
* **Creation**: Click "Add Policy" to define a new insurance policy (e.g., Vehicle, Health, Home).
* **Storage**: Policies are saved automatically through the backend API (`POST /api/policies`) and persisted securely.

## 3. Processing Claims

Claims are requests for payout placed against active policies.
* **Filing**: Standard users can navigate to the **Claims** section to file a claim. You must assign it to one of your active policies.
* **Approval/Rejection**: An **Admin** user can log into the system, open the **Admin Dashboard**, locate pending claims via the table interface, and execute an `Approve` or `Reject` command.
* **Persistence**: Claim status transitions are tracked historically to prevent data loss.

## 4. Notifications & Activities

* **System Notifications**: The platform continually checks for policy expiration events natively. If a policy is approaching its expiration, a notification is silently pushed to the backend and presented via the notification "Bell" icon in the top right.
* **Audit Logs / Activities**: Any significant action—like updating settings, creating policies, changing user roles, or submitting claims—is recorded as an "Activity". This ensures total transparency across user actions in the `ActivityLog` overview.

## 5. Technical Administration

For developers interacting directly with the system:
* **Data Inspection**: Since this leverages a JSON-based database, locate `db.json` at the root folder to inspect raw data payloads directly or run manual cleanups without requiring complex database queries.
* **Restarting**: Whenever you deploy changes to the Express API (such as adding a field validation or a new route in `server.ts`), restart your dev server.
* **Scalability**: For heavier workloads or environments expecting high concurrency, it is recommended to substitute the `db.json` backend logic entirely with a PostgreSQL or MongoDB connection directly in the `server.ts` Express handlers.
