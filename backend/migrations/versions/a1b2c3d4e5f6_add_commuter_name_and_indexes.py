"""Add commuter_name to fleet_records, composite indexes

Revision ID: a1b2c3d4e5f6
Revises: 78327c53c9a7
Create Date: 2026-08-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '78327c53c9a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add commuter_name column to fleet_records
    op.add_column('fleet_records', sa.Column('commuter_name', sa.String(), nullable=True))
    op.create_index('ix_fleet_records_commuter_name', 'fleet_records', ['commuter_name'], unique=False)
    op.create_index('ix_fleet_records_commuter_date_amount', 'fleet_records', ['commuter_name', 'date', 'amount'], unique=False)
    op.create_index('ix_fleet_records_date_fleet', 'fleet_records', ['date', 'fleet'], unique=False)

    # Add indexes to audit_logs
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_audit_logs_timestamp', table_name='audit_logs')
    op.drop_index('ix_audit_logs_action', table_name='audit_logs')
    op.drop_index('ix_fleet_records_date_fleet', table_name='fleet_records')
    op.drop_index('ix_fleet_records_commuter_date_amount', table_name='fleet_records')
    op.drop_index('ix_fleet_records_commuter_name', table_name='fleet_records')
    op.drop_column('fleet_records', 'commuter_name')
