<?php

/**
 * src/Controller/Spot/SpotCommandController.php
 *
 * @license https://opensource.org/licenses/MIT MIT License
 * @link    https://www.etsisi.upm.es/ ETS de Ingeniería de Sistemas Informáticos
 */

namespace TDW\IPanel\Controller\Spot;

use Doctrine\ORM;
use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Http\Response;
use TDW\IPanel\Controller\TraitController;
use TDW\IPanel\Enum\TipoPunto;
use TDW\IPanel\Model\Punto;
use TDW\IPanel\Utility\Error;

/**
 * Class SpotCommandController
 */
class SpotCommandController
{
    use TraitController;

    // constructor - receives the EntityManager from container instance
    public function __construct(
        protected ORM\EntityManager $entityManager
    ) { }

    /**
     * Summary: Creates a new Spot
     *
     * @param Request $request
     * @param Response $response
     * @return Response
     * @throws ORM\Exception\ORMException
     */
    public function post(Request $request, Response $response): Response
    {
        assert($request->getMethod() === 'POST');

        // 1️⃣ Extraemos los datos que nos envía el Swagger o el Front-End en formato JSON
        $reqData = $request->getParsedBody() ?? [];

        // 2️⃣ Comprobamos que nos han mandado lo mínimo necesario (el tipo y el código)
        if (!isset($reqData['tipo']) || !isset($reqData['codigo'])) {
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST); // Error 400
        }

        try {
            // 3️⃣ Creamos el objeto Punto usando la clase que hicieron tus profesores
            $nuevoPunto = new Punto(
                $reqData['tipo'],
                (string) $reqData['codigo']
            );

            // 4️⃣ Le decimos al cocinero (Doctrine) que guarde este nuevo punto en la BD
            $this->entityManager->persist($nuevoPunto);
            $this->entityManager->flush();

            // 5️⃣ Devolvemos el punto creado con un código 201 (Created)
            return $response->withJson($nuevoPunto, StatusCode::STATUS_CREATED);

        } catch (\InvalidArgumentException $e) {
            // Si el 'tipo' de punto no es válido (ej: no es PUERTA, MOSTRADOR, etc.)
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }
    }

    /**
     * Summary: Updates a Spot
     *
     * @param Request $request
     * @param Response $response
     * @param array<string, mixed> $args
     * @return Response
     * @throws ORM\Exception\ORMException
     */
    public function put(Request $request, Response $response, array $args): Response
    {
        assert($request->getMethod() === 'PUT');

        // 1️⃣ RECOGER EL ID: Pillamos el ID de la URL (ej: /spots/1 -> el ID es 1)
        $puntoId = (int) ($args['spotId'] ?? 0);

        // 2️⃣ BUSCAR: Le decimos a Doctrine (el ORM) que busque ese Punto en la BD
        $punto = $this->entityManager->getRepository(Punto::class)->find($puntoId);

        // 3️⃣ COMPROBAR: Si el punto no existe (null), devolvemos un 404 Not Found
        if ($punto === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        // 4️⃣ LEER LOS DATOS NUEVOS: Sacamos el JSON que nos manda el usuario desde Swagger
        $reqData = $request->getParsedBody() ?? [];

        try {
            // 5️⃣ ACTUALIZAR: Si el usuario ha enviado un 'tipo' o 'codigo' nuevo, machacamos los viejos
            if (isset($reqData['tipo'])) {
                $punto->setTipo($reqData['tipo']);
            }
            if (isset($reqData['codigo'])) {
                $punto->setCodigo((string) $reqData['codigo']);
            }

            // 6️⃣ GUARDAR: Hacemos 'flush' para que Doctrine guarde los cambios en MySQL
            $this->entityManager->flush();

            // 7️⃣ DEVOLVER: Mandamos el Punto ya actualizado con un código 200 (OK)
            return $response->withJson($punto, StatusCode::STATUS_OK);

        } catch (\InvalidArgumentException $e) {
            // Si nos mandan un tipo de punto que no es válido, salta este error 400
            return Error::createResponse($response, StatusCode::STATUS_BAD_REQUEST);
        }
    }

    /**
     * Summary: Deletes a Spot
     * ...
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        assert($request->getMethod() === 'DELETE');

        // 1️⃣ RECOGER EL ID: Pillamos el número de la URL (ej: /spots/1)
        $puntoId = (int) ($args['spotId'] ?? 0);

        // 2️⃣ BUSCAR: Buscamos la carpeta en el archivador
        $punto = $this->entityManager->getRepository(Punto::class)->find($puntoId);

        // 3️⃣ COMPROBAR: Si el punto ya no existe (alguien lo borró antes), devolvemos 404
        if ($punto === null) {
            return Error::createResponse($response, StatusCode::STATUS_NOT_FOUND);
        }

        // 4️⃣ DESTRUIR: Le decimos a Doctrine que meta el folio en la trituradora
        $this->entityManager->remove($punto);
        
        // 5️⃣ GUARDAR: Confirmamos la destrucción en la base de datos real
        $this->entityManager->flush();

        // 6️⃣ RESPONDER: Devolvemos un código 204 (No Content), que significa "Hecho, y no hay nada más que enseñar"
        return $response->withStatus(StatusCode::STATUS_NO_CONTENT);
    }
}
