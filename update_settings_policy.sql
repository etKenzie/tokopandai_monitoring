-- Update the policy to allow access to goal_profit and goal_cash_in settings
ALTER POLICY \
Authenticated
users
can
read
public
settings\
ON \public\.\app_settings\
TO public
USING (
  ((is_public = true) AND (auth.role() = 'authenticated'::text))
  OR 
  ((key IN ('goal_profit', 'goal_cash_in')) AND (auth.role() = 'authenticated'::text))
);
