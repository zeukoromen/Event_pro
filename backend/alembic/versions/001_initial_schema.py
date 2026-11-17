"""create_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-02 14:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Profiles Table (Synced with Supabase Auth) ─────────────────────────
    op.create_table(
        'profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=1024), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_profiles_email'), 'profiles', ['email'], unique=True)

    # ── 2. Events Table ───────────────────────────────────────────────────────
    op.create_table(
        'events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('organizer_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('event_date', sa.Date(), nullable=True),
        sa.Column('start_time', sa.String(length=50), nullable=True),
        sa.Column('end_time', sa.String(length=50), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('cover_image_url', sa.String(length=1024), nullable=True),
        sa.Column('invitation_message', sa.Text(), nullable=True),
        sa.Column('public_token', sa.String(length=64), nullable=False),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('allow_maybe_rsvp', sa.Boolean(), nullable=False),
        sa.Column('collect_dietary_preferences', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['organizer_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_events_organizer_id'), 'events', ['organizer_id'], unique=False)
    op.create_index(op.f('ix_events_public_token'), 'events', ['public_token'], unique=True)

    # ── 3. Attendees Table ────────────────────────────────────────────────────
    op.create_table(
        'attendees',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('event_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('dietary_preferences', sa.String(length=255), nullable=True),
        sa.Column('rsvp_status', sa.String(length=20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attendees_event_id'), 'attendees', ['event_id'], unique=False)
    op.create_index(op.f('ix_attendees_email'), 'attendees', ['email'], unique=False)
    op.create_index(op.f('ix_attendees_rsvp_status'), 'attendees', ['rsvp_status'], unique=False)

    # ── 4. Tasks Table ────────────────────────────────────────────────────────
    op.create_table(
        'tasks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('event_id', sa.String(length=36), nullable=False),
        sa.Column('assignee_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assignee_id'], ['attendees.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_event_id'), 'tasks', ['event_id'], unique=False)
    op.create_index(op.f('ix_tasks_status'), 'tasks', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('tasks')
    op.drop_table('attendees')
    op.drop_table('events')
    op.drop_table('profiles')
