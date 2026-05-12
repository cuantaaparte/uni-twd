<?php

namespace TDW\IPanel\Controller\Operation;

use Doctrine\ORM\EntityManager;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Http\Response;
use Slim\Routing\RouteContext;
use TDW\IPanel\Controller\TraitController;
use TDW\IPanel\Model\Operacion;
use TDW\IPanel\Utility\Error;

class OperationQueryController
{
    use TraitController;

    public const string PATH_OPERATIONS = '/operations';

    public function __construct(
        protected readonly EntityManager $entityManager
    ) { }

    public function cget(Request $request, Response $response): Response
    {
        $operaciones = $this->entityManager->getRepository(Operacion::class)->findAll();
        return $response->withJson(['operaciones' => $operaciones], StatusCode::STATUS_OK);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        $opId = (string) ($args['operationId'] ?? '');
        $operacion = $this->entityManager->getRepository(Operacion::class)->find($opId);

        if ($operacion === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        return $response->withJson($operacion, StatusCode::STATUS_OK);
    }

    public function options(Request $request, Response $response): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $routingResults = $routeContext->getRoutingResults();
        $methods = $routingResults->getAllowedMethods();

        return $response
            ->withStatus(204)
            ->withAddedHeader('Cache-Control', 'private')
            ->withAddedHeader('Allow', implode(',', $methods));
    }
}