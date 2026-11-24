// One response shape for the whole API: { success, data, meta? } or { success: false, message, details? }
function ok(res, data, status = 200, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function paginate(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function pageMeta(page, limit, total) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { ok, paginate, pageMeta, escapeRegex };
