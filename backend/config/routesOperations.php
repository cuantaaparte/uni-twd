<?php

/**
 * config/routesOperations.php
 *
 * @license https://opensource.org/licenses/MIT MIT License
 * @link    https://www.etsisi.upm.es/ ETS de Ingeniería de Sistemas Informáticos
 */

use Slim\App;
use TDW\IPanel\Controller\Operation\OperationCommandController;
use TDW\IPanel\Controller\Operation\OperationQueryController;
use TDW\IPanel\Middleware\JwtMiddleware;

return function (App $app) {

    // Las Operaciones usan un ULID (letras y números), no un entero normal
    $REGEX_OPERATION_ID = '/{operationId:[0-9A-Za-z]+}';

    // CGET|HEAD: Returns all operations
    $app->map(
        [ 'GET', 'HEAD' ],
        $_ENV['RUTA_API'] . OperationQueryController::PATH_OPERATIONS,
        OperationQueryController::class . ':cget'
    )->setName('tdw_operations_cget');

    // GET|HEAD: Returns a operation based on a single ID
    $app->map(
        [ 'GET', 'HEAD' ],
        $_ENV['RUTA_API'] . OperationQueryController::PATH_OPERATIONS . $REGEX_OPERATION_ID,
        OperationQueryController::class . ':get'
    )->setName('tdw_operations_read');

    // OPTIONS: Provides the list of HTTP supported methods
    $app->options(
        $_ENV['RUTA_API'] . OperationQueryController::PATH_OPERATIONS . '[' . $REGEX_OPERATION_ID . ']',
        OperationQueryController::class . ':options'
    )->setName('tdw_operations_options');

    // DELETE: Deletes a operation
    $app->delete(
        $_ENV['RUTA_API'] . OperationQueryController::PATH_OPERATIONS . $REGEX_OPERATION_ID,
        OperationCommandController::class . ':delete'
    )->setName('tdw_operations_delete')
        ->add(JwtMiddleware::class);

    // POST: Creates a new operation
    $app->post(
        $_ENV['RUTA_API'] . OperationQueryController::PATH_OPERATIONS,
        OperationCommandController::class . ':post'
    )->setName('tdw_operations_create')
        ->add(JwtMiddleware::class);

    // PUT: Updates a operation
    $app->put(
        $_ENV['RUTA_API'] . OperationQueryController::PATH_OPERATIONS . $REGEX_OPERATION_ID,
        OperationCommandController::class . ':put'
    )->setName('tdw_operations_update')
        ->add(JwtMiddleware::class);
};