-- Create audit_logs table for tracking admin actions
-- This table stores a complete audit trail of all admin operations

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_id UUID NOT NULL,
    actor_email TEXT NOT NULL,
    target_id UUID,
    target_email TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);

-- Add RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only chairman can view audit logs
CREATE POLICY "Chairman can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.id = auth.uid()
            AND admins.role = 'chairman'
        )
    );

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all admin actions in the system';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: DELETE_STUDENT, CREATE_GROUP, ASSIGN_STUDENT, etc.';
COMMENT ON COLUMN audit_logs.actor_id IS 'UUID of the admin who performed the action';
COMMENT ON COLUMN audit_logs.target_id IS 'UUID of the affected entity (student, group, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with additional context about the action';
