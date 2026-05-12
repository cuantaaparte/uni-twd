<?php

namespace TDW\IPanel\Controller\Spot;

use Doctrine\Common\Collections\Criteria;
use Doctrine\ORM\EntityManager;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Http\Response;
use TDW\IPanel\Controller\TraitController;
use TDW\IPanel\Model\Punto;
use TDW\IPanel\Utility\Error;

class SpotQueryController
{
    use TraitController;

    const string PATH_SPOTS = '/spots';

    public function __construct(
        protected readonly EntityManager $entityManager
    ) { }

    public function cget(Request $request, Response $response): Response
    {
        $puntos = $this->entityManager->getRepository(Punto::class)->findAll();

        if (empty($puntos)) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $etag = md5((string) json_encode(['puntos' => $puntos]));
        if ($request->hasHeader('If-None-Match') && $request->getHeaderLine('If-None-Match') === $etag) {
            return $response->withStatus(StatusCode::STATUS_NOT_MODIFIED);
        }

        return $response->withHeader('ETag', $etag)->withJson(['puntos' => $puntos], StatusCode::STATUS_OK);
    }

    public function get(Request $request, Response $response, array $args): Response
    {
        assert(in_array($request->getMethod(), [ 'GET', 'HEAD' ], true));
        $puntoId = (int) ($args['spotId'] ?? 0);
        $punto = $this->entityManager->getRepository(Punto::class)->find($puntoId);

        if ($punto === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        $etag = md5((string) json_encode(['punto' => $punto]));
        if ($request->hasHeader('If-None-Match') && $request->getHeaderLine('If-None-Match') === $etag) {
            return $response->withStatus(StatusCode::STATUS_NOT_MODIFIED);
        }

        return $response->withHeader('ETag', $etag)->withJson($punto, StatusCode::STATUS_OK);
    }

    public function getElementByName(Request $request, Response $response, array $args): Response
    {
        assert($request->getMethod() === 'GET');

        $name = $args['spotName'] ?? '';
        $punto = $this->entityManager->getRepository(Punto::class)->findOneBy(['codigo' => $name]);

        if ($punto === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        return $response->withStatus(StatusCode::STATUS_NO_CONTENT);
    }

    public function options(Request $request, Response $response): Response
    {
        assert($request->getMethod() === 'OPTIONS');

        return $response
            ->withHeader('Allow', 'OPTIONS, GET, HEAD, POST, PUT, DELETE')
            ->withStatus(StatusCode::STATUS_NO_CONTENT);
    }

    private function buildCriteria(array $params): Criteria
    {
        $criteria = new Criteria();
        $params['order'] = ($params['order'] ?? '' === 'id') ? 'puntoId' : null;
        if (array_key_exists('order', $params)) { 
            $order = (in_array($params['order'], ['puntoId', 'codigo'], true)) ? $params['order'] : null;
        }
        if (array_key_exists('ordering', $params)) {
            $ordering = ('DESC' === $params['ordering']) ? 'DESC' : null;
        }
        $criteria->orderBy([$order ?? 'puntoId' => $ordering ?? 'ASC']);
        if (array_key_exists('name', $params)) {
            $txtName = $params['name'];
            assert(preg_match('^[a-zA-Z0-9()áéíóúÁÉÍÓÚñÑ %$.+-]+$^', $txtName) !== false);
            $expressionBuilder = Criteria::expr();
            $expression = $expressionBuilder->contains('codigo', $txtName);
            $criteria->andWhere($expression);
        }

        return $criteria;
    }
}