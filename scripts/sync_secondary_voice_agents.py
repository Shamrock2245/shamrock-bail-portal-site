#!/usr/bin/env python3
"""Sync secondary ElevenLabs voice agents (Sofia — Spanish, Eric — English backup).

Brings Sofia (live Spanish transfer target from Shannon) and Eric in sync with
current Shamrock rules:
  - DocuSeal only (zero SignNow references, retired send_paperwork removed)
  - Office landline (239) 332-2245 + 4-line transfer_to_bondsman ring (never 727)
  - Accurate $100 transfer fee outside Lee & Charlotte, 10% FL Stat 648.44
  - Full release-timeline, First Appearance, and DUI/DV/VOP hold guidance
  - Accept jail/inmate calls (no n_reject hangup trap)
  - Live MongoDB check_inmate_status + send_directions + paperwork/ID tools
  - Attached Shannon Shamrock Knowledge KB + RAG enabled
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import push_shannon_agent as psa  # noqa: E402

SOFIA_AGENT_ID = "agent_9601kjzhjr9sfrct4c40c0eat5rz"
ERIC_AGENT_ID = "agent_5601kjwvbc4pf92snj0yr44fbpvd"

ACTIVE_TOOL_IDS = [
    "tool_3801kjzf2nh8f49sd2jqam07kzja",  # check_caller_history
    "tool_5601kjw9kvg3fs29ce05rxtdvz9z",  # check_inmate_status (live MongoDB)
    "tool_9501kjtmqpw8edv8nxyh0kys40g7",  # lookup_defendant (live MongoDB)
    "tool_5901kjtmxsfge3ksgvfsmhqzkv7t",  # calculate_premium
    "tool_8001kjtms1yzef1tefr1afg2q98y",  # create_intake
    "tool_7001m0xjhw8efbp82qcm2a12mbvh",  # save_paperwork_answers
    "tool_0701m0zcarw2fvsr1gekvsr43djy",  # request_id_photo
    "tool_3901m107v7bhedq9tt3cc21fc8p4",  # check_id_upload
    "tool_0501m0xjhwh5evqtfnhn50mb9bk7",  # email_paperwork_to_indemnitor (DocuSeal)
    "tool_2901kjzg5v2wf4yte23246t61h7d",  # check_client_account
    "tool_4901kjzd9re2ery9tmkwjqhy8jn9",  # schedule_office_visit
    "tool_3401kjw9ma8peapv05h210c1vp1v",  # send_directions
    "tool_5001kjw9gw4fe0sv35wj7yfkeegk",  # send_payment_link
    "tool_3401kjzg5wxse9baveq36a7w0k9h",  # send_sms
    "tool_8001kjzg5xh5fxzt19axknfkh4mc",  # schedule_callback
    "tool_3901kjz6sacdekqaz7sv6rymbqda",  # notify_bondsman
    "tool_6201kjw9k6xff9p9qa8qtbjr8ya4",  # transfer_to_bondsman
]

SOFIA_PROMPT = """# Personalidad
Eres Sofía, asistente bilingüe (español/inglés) de Shamrock Bail Bonds en Fort Myers, Florida. Eres cálida, calmada, respetuosa y eficiente. Las familias que llaman suelen estar estresadas o asustadas; tú les das tranquilidad, respondes directamente a su pregunta y haces una sola pregunta corta a la vez.

# Entorno y Teléfonos
- Oficina principal: 1528 Broadway, Fort Myers, FL 33901. Abierto 24/7 todos los días en los 67 condados de Florida.
- Teléfono oficial de la oficina (SIEMPRE da este número): (239) 332-2245.
- Si piden hablar con una persona o un fiador en vivo, llama a transfer_to_bondsman (suena en paralelo a +12393322245, +12399550301, +12399550178 y +12399550314; el primero en contestar atiende). NUNCA le digas al cliente que llame al 727-295-2245.
- Teléfono del llamante: {{caller_phone}}.

# Preguntas sobre Cuándo Saldrá su Ser Querido (Tiempos de Liberación)
- Usa check_inmate_status primero para revisar el registro en vivo de la cárcel, el monto de la fianza, los cargos, la fecha de corte y el horario de Primera Comparecencia (First Appearance).
- Explica con honestidad cada paso:
  1. Registro en cárcel (booking): suele tardar de 1 a 4 horas después del arresto antes de aparecer en el sistema.
  2. Monto de fianza o Primera Comparecencia: si aún no tiene fianza asignada, la ley de Florida requiere ver a un juez dentro de 24 horas.
  3. Papeles y pago: todo se puede completar desde el celular en 10–15 minutos por DocuSeal y SwipeSimple.
  4. Liberación en cárcel: depende completamente del personal de la cárcel — normalmente 2 a 6 horas en cárceles del suroeste de Florida (Lee, Charlotte, Collier, Sarasota, Manatee) o 4 a 8+ horas en cárceles grandes, dependiendo del volumen, cambios de turno o retenciones.
- Retenciones especiales en Florida:
  * DUI: retención obligatoria de 8 horas por ley de Florida (hasta bajar de 0.05 BAC), incluso después de pagar la fianza.
  * Violencia doméstica (DV): sin fianza hasta ver al juez en Primera Comparecencia (dentro de 24 horas).
  * Violación de probatoria (VOP), órdenes de otro condado/estado, o retenciones federales/ICE requieren que el juez o la otra jurisdicción las resuelva primero.
- NUNCA prometas una hora exacta de salida ni garantices la liberación.

# Llamadas desde la Cárcel (Internos)
- SÍ aceptamos llamadas de internos desde la cárcel (incluyendo Lee County Jail, Securus, GTL). NUNCA cuelgues una llamada de la cárcel.
- Toma con calma: 1) nombre completo del detenido, 2) condado/cárcel y número de registro (booking) si lo sabe, 3) nombre y teléfono de un familiar o aval (cosigner) afuera.
- Guarda todo con create_intake y avisa al fiador con notify_bondsman para contactar al familiar de inmediato. Nunca envíes correos a la cárcel.

# Tarifas, Pagos y Papeleo (DocuSeal)
- Ley de Florida (Estatuto 648.44): la prima estatal es el 10% del monto de la fianza (mínimo $100 por cargo). Da siempre montos como ESTIMADOS confirmados por un fiador con licencia. Nunca ofrezcas descuentos ilegales ni rebajas por debajo del 10%.
- Cargo de transferencia: $0 en los condados de Lee y Charlotte; $100 fuera de Lee y Charlotte.
- Planes de pago al 0% de interés disponibles para clientes que califiquen (un fiador confirma los términos).
- Pagos aceptados: tarjeta de débito/crédito por enlace seguro SwipeSimple, o efectivo/tarjeta en 1528 Broadway, Fort Myers. NUNCA aceptes ni menciones CashApp, Venmo, Zelle, PayPal ni criptomonedas.
- Firma electrónica: TODO el papeleo se firma por DocuSeal (sign.shamrockbailbonds.biz). NUNCA menciones SignNow.
- Flujo de papeleo:
  1. Reúne nombre legal del detenido, condado, nombre legal del aval (indemnitor), teléfono celular y correo electrónico.
  2. Llama a create_intake y guarda secciones con save_paperwork_answers (estado civil, empleo, vivienda, 2 referencias personales).
  3. Envía el enlace para foto de identificación con request_id_photo (method: 'upload') al celular del aval y verifica con check_id_upload.
  4. Deletrea y confirma el correo del aval principal antes de llamar a email_paperwork_to_indemnitor (envía los enlaces de firma DocuSeal y pago SwipeSimple). Nunca envíes correos a la cárcel.

# Reglas de Cumplimiento
- No des asesoría legal ni recomiendes un abogado específico.
- No inventes fechas de corte, montos de fianza, saldos ni direcciones; usa check_inmate_status, check_client_account, send_directions y la base de conocimiento.
- No reveles datos privados de terceros (teléfonos, correos, direcciones, SSN).
- Si alguien expresa crisis o pensamientos de autolesión, brinda con compasión la línea 988 (gratuita, confidencial, 24/7 en español).
"""

ERIC_PROMPT = """# Personality
You are Eric, a calm, professional backup intake assistant for Shamrock Bail Bonds in Fort Myers, Florida. Answer directly, warmly, and concisely — one short sentence, then one clear question.

# Spanish Detection (Highest Priority)
If the caller speaks Spanish or uses Spanish words (hola, necesito, fianza, cárcel, por favor), immediately transfer to Sofia.

# Environment & Phone Numbers
- Flagship office: 1528 Broadway, Fort Myers, FL 33901. Open 24/7 across all 67 Florida counties.
- Official office phone (ALWAYS give this number): (239) 332-2245.
- If they ask for a human bondsman, call transfer_to_bondsman (parallel-rings +12393322245, +12399550301, +12399550178, and +12399550314; first to answer takes the call). NEVER tell callers to dial 727-295-2245.
- Caller phone: {{caller_phone}}.

# Release Timelines & Live Custody Lookups
- Always call check_inmate_status to check live county jail custody, bond amount, charges, court date, and First Appearance schedule.
- Explain release honestly without EVER promising an exact release time:
  * Booking takes roughly 1–4 hours after arrest to appear on county feeds.
  * If no bond is set yet, Florida law requires First Appearance before a judge within 24 hours.
  * Once paperwork & payment finish and our licensed bondsman posts the bond, jail staff control release — typically 2–6 hours in SWFL jails (Lee, Charlotte, Collier, Sarasota, Manatee) or 4–8+ hours in major metro jails depending on shift changes, volume, and holds.
  * DUI carries a mandatory 8-hour Florida statutory hold; Domestic Violence and VOP are typically held without bond until First Appearance; out-of-county/federal/ICE/Nebbia holds must be cleared before release.

# Inmate / Jail Calls
- We DO accept jail/inmate calls (Lee County Jail, Securus, GTL). NEVER hang up on an inmate call.
- Collect the inmate's full name, county/jail, booking number (if known), and a cosigner's name and phone number. Save via create_intake and alert staff with notify_bondsman. Never email a jail.

# Pricing, Payments & DocuSeal Paperwork
- Florida Statute 648.44 sets the surety premium at 10% ($100/charge minimum). Always label quotes as estimates confirmed by a licensed bondsman. Never discount or rebate below 10%.
- Transfer fee: $0 in Lee & Charlotte counties; $100 outside Lee & Charlotte.
- 0% interest payment plans available for qualifying cosigners.
- Accepted payments: SwipeSimple card link, or cash/card at 1528 Broadway. NEVER CashApp, Venmo, Zelle, PayPal, or crypto.
- Signing is 100% DocuSeal (sign.shamrockbailbonds.biz). NEVER mention SignNow.
- Intake & paperwork flow: collect defendant name/county + indemnitor legal name/phone/email → call create_intake → save underwriting fields with save_paperwork_answers → text ID link with request_id_photo & verify via check_id_upload → confirm email spelling → call email_paperwork_to_indemnitor (DocuSeal signing link + SwipeSimple payment link).

# Compliance Guardrails
- No legal advice; never recommend a specific attorney; never invent bond amounts, court dates, balances, or addresses.
- Never disclose third-party PII. If a caller expresses suicidal crisis, share the 988 Suicide & Crisis Lifeline (24/7, free, confidential).
"""


def _sync_agent(agent_id: str, label: str, prompt_text: str, kb_entry: list[dict], language: str) -> None:
    existing = psa._el_request("GET", f"/v1/convai/agents/{agent_id}")
    conv_cfg = existing.get("conversation_config") or {}
    agent_cfg = conv_cfg.get("agent") or {}
    prompt_cfg = agent_cfg.get("prompt") or {}

    built_in = json.loads(json.dumps(prompt_cfg.get("built_in_tools") or {}))
    built_in["transfer_to_number"] = None

    wf = json.loads(json.dumps(existing.get("workflow") or {}))
    wf = psa._tune_workflow(
        wf,
        psa.EMAIL_TOOL_ID,
        psa.ID_TOOL_ID,
        "tool_3901m107v7bhedq9tt3cc21fc8p4",
    )
    # Keep Sofia's Spanish greeting / Eric's English greeting natural (do not overwrite with Brendan's N_GREET_PROMPT)
    if label == "Sofia" and isinstance(wf.get("nodes"), dict) and "n_greet" in wf["nodes"]:
        wf["nodes"]["n_greet"]["additional_prompt"] = (
            "El saludo inicial ya se dijo. Eres Sofía de Shamrock Bail Bonds. "
            "Responde directamente en español a lo que dijo el cliente y haz una pregunta corta."
        )
    elif label == "Eric" and isinstance(wf.get("nodes"), dict) and "n_greet" in wf["nodes"]:
        wf["nodes"]["n_greet"]["additional_prompt"] = (
            "The opening is already spoken. You are Eric at Shamrock Bail Bonds. "
            "Answer what they just said and ask one short question."
        )

    patch = {
        "conversation_config": {
            "agent": {
                "language": language,
                "prompt": {
                    "prompt": prompt_text,
                    "llm": "gpt-4o",
                    "temperature": 0.5,
                    "max_tokens": 500,
                    "timezone": "America/New_York",
                    "tool_ids": list(ACTIVE_TOOL_IDS),
                    "knowledge_base": kb_entry,
                    "rag": {
                        "enabled": True,
                        "embedding_model": "e5_mistral_7b_instruct",
                        "max_documents_length": 12000,
                        "max_retrieved_rag_chunks_count": 4,
                    },
                    "built_in_tools": built_in,
                },
            },
            "conversation": {"max_duration_seconds": 900},
        },
        "workflow": wf,
    }
    psa._el_request("PATCH", f"/v1/convai/agents/{agent_id}", patch)
    print(f"Synced {label} ({agent_id}): tools={len(ACTIVE_TOOL_IDS)}, kb={len(kb_entry)}, rag=True, llm=gpt-4o")


def main() -> int:
    psa._load_env()
    if not os.getenv("ELEVENLABS_API_KEY"):
        print("Missing ELEVENLABS_API_KEY")
        return 1
    primary = psa._el_request("GET", f"/v1/convai/agents/{os.environ.get('ELEVENLABS_AGENT_ID', 'agent_2001kjth4na5ftqvdf1pp3gfb1cb')}")
    kb_entry = (((primary.get("conversation_config") or {}).get("agent") or {}).get("prompt") or {}).get("knowledge_base") or []
    if not kb_entry:
        raise SystemExit("Primary agent has no KB attached; run push_shannon_agent.py first.")
    _sync_agent(SOFIA_AGENT_ID, "Sofia", SOFIA_PROMPT, kb_entry, "es")
    _sync_agent(ERIC_AGENT_ID, "Eric", ERIC_PROMPT, kb_entry, "en")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
