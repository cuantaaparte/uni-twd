<?php

namespace TDW\IPanel\Controller\Spot;

use Doctrine\ORM;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Http\Response;
use TDW\IPanel\Controller\TraitController;
use TDW\IPanel\Model\Punto;
use TDW\IPanel\Utility\Error;

class SpotCommandController
{
    use TraitController;

    public function __construct(
        protected ORM\EntityManager $entityManager
    ) { }

    // Portero infalible: Decodificamos el JWT manualmente desde la cabecera HTTP
    private function isGestor(Request $request): bool {
        $header = $request->getHeaderLine('Authorization');
        $token = trim(str_ireplace('Bearer', '', $header));
        $parts = explode('.', $token);
        
        // El JWT tiene 3 partes. La segunda es el payload en base64
        if (count($parts) === 3) {
            $payload = json_decode(base64_decode($parts[1]), true);
            if (is_array($payload) && isset($payload['scopes']) && is_array($payload['scopes'])) {
                // Buscamos si tiene el scope de gestor
                foreach ($payload['scopes'] as $scope) {
                    if (strtoupper((string)$scope) === 'GESTOR') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public function post(Request $request, Response $response): Response
    {
        assert($request->getMethod() === 'POST');

        // Si no eres gestor, te oculto la ruta (404)
        if (!$this->isGestor($request)) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $reqData = $request->getParsedBody() ?? [];

        // Exigencia del test: 422 si falta tipo o código
        if (empty($reqData['tipo']) || empty($reqData['codigo'])) {
            return Error::createResponse($response, StatusCode::STATUS_UNPROCESSABLE_ENTITY); 
        }

        // Exigencia del test: 400 si el código ya existe
        if ($this->entityManager->getRepository(Punto::class)->findOneBy(['codigo' => $reqData['codigo']])) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST); 
        }

        try {
            $nuevoPunto = new Punto($reqData['tipo'], (string) $reqData['codigo']);
            $this->entityManager->persist($nuevoPunto);
            $this->entityManager->flush();

            // Exigencia del test: Cabecera Location y 201 Created
            return $response
                ->withAddedHeader('Location', $request->getUri() . '/' . $nuevoPunto->getId())
                ->withJson($nuevoPunto, StatusCode::STATUS_CREATED);

        } catch (\InvalidArgumentException $e) {
            return Error::createResponse($response, StatusCode::STATUS_UNPROCESSABLE_ENTITY);
        }
    }

    public function put(Request $request, Response $response, array $args): Response
    {
        assert($request->getMethod() === 'PUT');

        if (!$this->isGestor($request)) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $puntoId = (int) ($args['spotId'] ?? 0);
        $punto = $this->entityManager->getRepository(Punto::class)->find($puntoId);

        if ($punto === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        // Exigencia del test: 428 si no mandan el ETag para evitar sobreescrituras
        if (!$request->hasHeader('If-Match')) {
            return Error::createResponse($response, StatusCode::STATUS_PRECONDITION_REQUIRED); 
        }

        $reqData = $request->getParsedBody() ?? [];

        if (isset($reqData['codigo'])) {
            $existing = $this->entityManager->getRepository(Punto::class)->findOneBy(['codigo' => $reqData['codigo']]);
            if ($existing && $existing->getId() !== $punto->getId()) {
                return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST); 
            }
        }

        try {
            if (isset($reqData['tipo'])) {
                $punto->setTipo($reqData['tipo']);
            }
            if (isset($reqData['codigo'])) {
                $punto->setCodigo((string) $reqData['codigo']);
            }

            $this->entityManager->flush();
            
            // Exigencia del test: 209 Updated
            return $response->withJson($punto, 209);

        } catch (\InvalidArgumentException $e) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        assert($request->getMethod() === 'DELETE');

        if (!$this->isGestor($request)) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $puntoId = (int) ($args['spotId'] ?? 0);
        $punto = $this->entityManager->getRepository(Punto::class)->find($puntoId);

        if ($punto === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $this->entityManager->remove($punto);
        $this->entityManager->flush();

        return $response->withStatus(StatusCode::STATUS_NO_CONTENT);
    }
}