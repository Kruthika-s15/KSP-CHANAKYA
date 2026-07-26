"""Add biometric records and case status history

Revision ID: 8a1f2b9c3d4e
Revises: 554d1c23fc96
Create Date: 2026-07-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a1f2b9c3d4e'
down_revision: Union[str, Sequence[str], None] = '554d1c23fc96'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'biometricrecord',
        sa.Column('BiometricID', sa.Integer(), nullable=False),
        sa.Column('AccusedMasterID', sa.Integer(), nullable=False),
        sa.Column('BiometricType', sa.String(), nullable=False),
        sa.Column('BiometricRefID', sa.String(), nullable=False),
        sa.Column('CapturedDate', sa.Date(), nullable=True),
        sa.Column('CapturedByID', sa.Integer(), nullable=True),
        sa.Column('Remarks', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['AccusedMasterID'], ['accused.AccusedMasterID'], ),
        sa.ForeignKeyConstraint(['CapturedByID'], ['employee.EmployeeID'], ),
        sa.PrimaryKeyConstraint('BiometricID'),
    )
    op.create_index(
        op.f('ix_biometricrecord_BiometricRefID'),
        'biometricrecord', ['BiometricRefID'], unique=False,
    )

    op.create_table(
        'casestatushistory',
        sa.Column('CaseStatusHistoryID', sa.Integer(), nullable=False),
        sa.Column('CaseMasterID', sa.Integer(), nullable=False),
        sa.Column('CaseStatusID', sa.Integer(), nullable=False),
        sa.Column('ChangedDate', sa.DateTime(), nullable=False),
        sa.Column('ChangedByID', sa.Integer(), nullable=True),
        sa.Column('Remarks', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['CaseMasterID'], ['casemaster.CaseMasterID'], ),
        sa.ForeignKeyConstraint(['CaseStatusID'], ['casestatusmaster.CaseStatusID'], ),
        sa.ForeignKeyConstraint(['ChangedByID'], ['employee.EmployeeID'], ),
        sa.PrimaryKeyConstraint('CaseStatusHistoryID'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('casestatushistory')
    op.drop_index(op.f('ix_biometricrecord_BiometricRefID'), table_name='biometricrecord')
    op.drop_table('biometricrecord')
