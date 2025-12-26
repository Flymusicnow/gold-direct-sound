-- Allow authenticated users to create collab entities during onboarding
CREATE POLICY "Authenticated users can create collab entities"
ON public.collab_entities FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to insert themselves as entity admin (owner of their own entity)
CREATE POLICY "Users can add themselves as entity admin"
ON public.collab_entity_admins FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow entity admins to update their own entities
CREATE POLICY "Entity admins can update their entities"
ON public.collab_entities FOR UPDATE
USING (is_collab_entity_admin(auth.uid(), id));

-- Allow entity admins to manage team members for their entities
CREATE POLICY "Entity admins can manage team members"
ON public.collab_entity_admins FOR ALL
USING (is_collab_entity_admin(auth.uid(), collab_entity_id));