/**
 * Permissions Middleware - Controle de acesso por Cargo
 *
 * Requer que o authMiddleware já tenha preenchido req.user e req.user.cargo
 * com as flags booleanas de permissão.
 *
 * Regra: sem permissão => 403 (comportamento esperado, não "erro do sistema")
 */

/**
 * @typedef {'acesso_templates'|'acesso_acoes'|'acesso_usuarios'|'deletar_demandas'|'cargo_disponivel_como_responsavel'|'usuarios_disponiveis_como_responsaveis'} CargoPermissionKey
 */

/**
 * Middleware factory para exigir uma permissão do cargo do usuário.
 * @param {CargoPermissionKey} permission
 */
function requireCargoPermission(permission) {
  return function cargoPermissionMiddleware(req, res, next) {
    const cargo = req.user?.cargo;

    if (!cargo) {
      return res.status(403).json({
        error: 'Sem permissão',
        message: 'Usuário sem cargo associado (configuração inválida)',
      });
    }

    if (cargo[permission] !== true) {
      return res.status(403).json({
        error: 'Sem permissão',
        message: `Permissão requerida: ${permission}`,
      });
    }

    return next();
  };
}

module.exports = {
  requireCargoPermission,
};


