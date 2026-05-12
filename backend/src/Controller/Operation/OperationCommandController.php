<?php

namespace TDW\IPanel\Controller\Operation;

use Doctrine\ORM;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Http\Response;
use TDW\IPanel\Controller\TraitController;
use TDW\IPanel\Model\{Operacion, Operador, Punto};
use TDW\IPanel\Enum\{TipoOperacion, SentidoOperacion, EstadoOperacion};
use TDW\IPanel\Utility\Error;
use DateTime;

class OperationCommandController
{
    use TraitController;

    public function __construct(
        protected ORM\EntityManager $entityManager
    ) { }

    public function post(Request $request, Response $response): Response
    {
        if (!$this->checkGestorScope($request)) return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);

        $reqData = $request->getParsedBody() ?? [];

        if (!isset($reqData['tipo'], $reqData['codigo'], $reqData['sentido'], $reqData['origen'], $reqData['destino'], $reqData['operadorId'], $reqData['puntoId'])) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }

        $operador = $this->entityManager->getRepository(Operador::class)->find((int)$reqData['operadorId']);
        $punto = $this->entityManager->getRepository(Punto::class)->find((int)$reqData['puntoId']);

        if (!$operador || !$punto) return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);

        try {
            $estado = isset($reqData['estado']) ? EstadoOperacion::from(strtolower($reqData['estado'])) : EstadoOperacion::PROGRAMADO;
            $hp = isset($reqData['horaProgramada']) ? new DateTime($reqData['horaProgramada']) : null;
            $he = isset($reqData['horaEstimada']) ? new DateTime($reqData['horaEstimada']) : null;

            $operacion = new Operacion(
                TipoOperacion::from(strtolower($reqData['tipo'])),
                (string) $reqData['codigo'],
                SentidoOperacion::from(strtolower($reqData['sentido'])),
                (string) $reqData['origen'],
                (string) $reqData['destino'],
                $operador,
                $punto,
                $estado,
                $hp,
                $he
            );

            $this->entityManager->persist($operacion);
            $this->entityManager->flush();

            return $response->withJson($operacion, StatusCode::STATUS_CREATED);
        } catch (\Throwable $e) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }
    }

    public function put(Request $request, Response $response, array $args): Response
    {
        if (!$this->checkGestorScope($request)) return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);

        $opId = (string) ($args['operationId'] ?? '');
        $operacion = $this->entityManager->getRepository(Operacion::class)->find($opId);

        if ($operacion === null) return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);

        $reqData = $request->getParsedBody() ?? [];

        try {
            if (isset($reqData['tipo'])) $operacion->setTipo($reqData['tipo']);
            if (isset($reqData['codigo'])) $operacion->setCodigo($reqData['codigo']);
            if (isset($reqData['sentido'])) $operacion->setSentido($reqData['sentido']);
            if (isset($reqData['origen'])) $operacion->setOrigen($reqData['origen']);
            if (isset($reqData['destino'])) $operacion->setDestino($reqData['destino']);
            if (isset($reqData['estado'])) $operacion->setEstado($reqData['estado']);
            if (isset($reqData['horaProgramada'])) $operacion->setHoraProgramada(new DateTime($reqData['horaProgramada']));
            if (isset($reqData['horaEstimada'])) $operacion->setHoraEstimada(new DateTime($reqData['horaEstimada']));

            if (isset($reqData['operadorId'])) {
                $operador = $this->entityManager->getRepository(Operador::class)->find((int)$reqData['operadorId']);
                if ($operador) $operacion->setOperador($operador);
            }
            if (isset($reqData['puntoId'])) {
                $punto = $this->entityManager->getRepository(Punto::class)->find((int)$reqData['puntoId']);
                if ($punto) $operacion->setPunto($punto);
            }

            $this->entityManager->flush();
            return $response->withJson($operacion, StatusCode::STATUS_OK);
        } catch (\Throwable $e) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        if (!$this->checkGestorScope($request)) return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);

        $opId = (string) ($args['operationId'] ?? '');
        $operacion = $this->entityManager->getRepository(Operacion::class)->find($opId);

        if ($operacion === null) return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);

        $this->entityManager->remove($operacion);
        $this->entityManager->flush();

        return $response->withStatus(StatusCode::STATUS_NO_CONTENT);
    }
}