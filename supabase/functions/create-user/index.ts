import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Configuração do Supabase incompleta" }, 500);
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autenticado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const callerId = claimsData?.claims?.sub;

    if (claimsError || !callerId) {
      return jsonResponse({ error: "Não autenticado" }, 401);
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("profiles")
      .select("user_type")
      .eq("id", callerId)
      .single();

    if (callerProfileError || callerProfile?.user_type !== "admin") {
      return jsonResponse({ error: "Apenas administradores podem gerenciar usuários" }, 403);
    }

    const {
      action = "create",
      userId,
      email,
      password,
      full_name,
      user_type,
      location,
      services = [],
    } = await req.json();

    if (!full_name || !user_type) {
      return jsonResponse({ error: "Nome e tipo de usuário são obrigatórios" }, 400);
    }

    if (!["admin", "attendant", "receptionist"].includes(user_type)) {
      return jsonResponse({ error: "Tipo de usuário inválido" }, 400);
    }

    if (!Array.isArray(services)) {
      return jsonResponse({ error: "Lista de serviços inválida" }, 400);
    }

    let managedUserId = userId as string | undefined;

    if (action === "create") {
      if (!email || !password) {
        return jsonResponse({ error: "Email e senha são obrigatórios" }, 400);
      }

      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          user_type,
          location: location || null,
        },
      });

      if (createError || !createdUser.user) {
        return jsonResponse({ error: createError?.message || "Erro ao criar usuário" }, 400);
      }

      managedUserId = createdUser.user.id;
    } else if (action === "update") {
      if (!managedUserId) {
        return jsonResponse({ error: "ID do usuário é obrigatório para edição" }, 400);
      }

      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(managedUserId, {
        user_metadata: {
          full_name,
          user_type,
          location: location || null,
        },
      });

      if (updateAuthError) {
        return jsonResponse({ error: updateAuthError.message }, 400);
      }
    } else {
      return jsonResponse({ error: "Ação inválida" }, 400);
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: managedUserId,
        full_name,
        user_type,
        location: location || null,
      });

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    const { error: deleteServicesError } = await adminClient
      .from("attendant_services")
      .delete()
      .eq("attendant_id", managedUserId);

    if (deleteServicesError) {
      return jsonResponse({ error: deleteServicesError.message }, 400);
    }

    const uniqueServiceIds = [...new Set((services as string[]).filter(Boolean))];

    if (user_type === "attendant" && uniqueServiceIds.length > 0) {
      const { error: insertServicesError } = await adminClient
        .from("attendant_services")
        .insert(
          uniqueServiceIds.map((serviceId) => ({
            attendant_id: managedUserId,
            service_id: serviceId,
          })),
        );

      if (insertServicesError) {
        return jsonResponse({ error: insertServicesError.message }, 400);
      }
    }

    return jsonResponse({
      action,
      user: { id: managedUserId, email: email ?? null },
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erro inesperado ao salvar usuário" },
      500,
    );
  }
});
