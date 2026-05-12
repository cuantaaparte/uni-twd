<?php

/**
 * tests/Controller/Operation/OperationControllerTest.php
 */

namespace TDW\Test\IPanel\Controller\Operation;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use PHPUnit\Framework\Attributes as TestAttr;
use TDW\IPanel\Controller\Operation\OperationCommandController;
use TDW\IPanel\Controller\Operation\OperationQueryController;
use TDW\IPanel\Utility\Utils;
use TDW\Test\IPanel\Controller\BaseTestCase;

/**
 * Class OperationControllerTest
 */
#[TestAttr\CoversClass(OperationQueryController::class)]
#[TestAttr\CoversClass(OperationCommandController::class)]
class OperationControllerTest extends BaseTestCase
{
    /** @var string Path para la gestión de operaciones */
    protected const string RUTA_API = '/api/v1/operations';

    /** @var array<string, mixed> $gestor */
    protected static array $gestor;

    /**
     * Se ejecuta una vez al inicio de las pruebas
     */
    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        // user admin (GESTOR) fixtures
        self::$gestor = [
            'email'    => (string) getenv('ADMIN_USER_EMAIL'),
            'password' => (string) getenv('ADMIN_USER_PASSWD'),
        ];
        self::$gestor['id'] = Utils::loadUserData(
            self::$gestor['email'],
            self::$gestor['password'],
            true
        );
    }

    /**
     * Test GET /operations 200 OK (Empty)
     */
    public function testCGetOperations200OkEmpty(): void
    {
        self::$gestor['authHeader'] = $this->getTokenHeaders(self::$gestor['email'], self::$gestor['password']);
        
        $response = $this->runApp(
            'GET',
            self::RUTA_API,
            null,
            self::$gestor['authHeader']
        );
        
        // Tu controlador devuelve 200 aunque esté vacío
        self::assertSame(StatusCode::STATUS_OK, $response->getStatusCode());
    }

    /**
     * Test POST /operations 201 CREATED
     *
     * @return array<string, mixed> OperationData
     */
    #[TestAttr\Depends('testCGetOperations200OkEmpty')]
    public function testPostOperation201Created(): array
    {
        // 1. Creamos un Operador falso (Dependencia)
        $opData = [
            'nombre' => self::$faker->company(),
            'siglas' => strtoupper(self::$faker->lexify('???'))
        ];
        $resOp = $this->runApp('POST', '/api/v1/operators', $opData, self::$gestor['authHeader']);
        $operadorId = json_decode($resOp->getBody()->getContents(), true)['operador']['id'] ?? json_decode($resOp->getBody()->getContents(), true)['id'];

        // 2. Creamos un Punto falso (Dependencia)
        $ptData = [
            'codigo' => self::$faker->regexify('[A-Z0-9]{5}'),
            'tipo'   => 'VIA' // Debe coincidir con uno de tus Enum (ej: VIA, ESTACION)
        ];
        $resPt = $this->runApp('POST', '/api/v1/spots', $ptData, self::$gestor['authHeader']);
        $puntoId = json_decode($resPt->getBody()->getContents(), true)['punto']['puntoId'] ?? json_decode($resPt->getBody()->getContents(), true)['puntoId'];

        // 3. Creamos la Operación
        $p_data = [
            'tipo'       => 'TREN', // Asegúrate de que existe en TipoOperacion
            'codigo'     => self::$faker->bothify('OP-####'),
            'sentido'    => 'LLEGADA', // Asegúrate de que existe en SentidoOperacion
            'origen'     => self::$faker->city(),
            'destino'    => self::$faker->city(),
            'operadorId' => $operadorId,
            'puntoId'    => $puntoId
        ];

        $response = $this->runApp(
            'POST',
            self::RUTA_API,
            $p_data,
            self::$gestor['authHeader']
        );
        
        self::assertSame(StatusCode::STATUS_CREATED, $response->getStatusCode());
        $r_body = $response->getBody()->getContents();
        self::assertJson($r_body);
        $responseData = json_decode($r_body, true);
        
        // Dependiendo de si tu JsonSerializable envuelve o no el objeto
        $operacion = $responseData['operacion'] ?? $responseData;
        
        // El ULID suele venir en 'operacionId' o 'id'
        $idStr = $operacion['operacionId'] ?? $operacion['id'] ?? null;
        self::assertNotEmpty($idStr);

        return $operacion;
    }

    /**
     * Test GET /operations/{operationId} 200 OK
     *
     * @param array<string, mixed> $operacion
     * @return array<string, mixed>
     */
    #[TestAttr\Depends('testPostOperation201Created')]
    public function testGetOperation200Ok(array $operacion): array
    {
        $idStr = $operacion['operacionId'] ?? $operacion['id'];
        
        $response = $this->runApp(
            'GET',
            self::RUTA_API . '/' . $idStr,
            null,
            self::$gestor['authHeader']
        );
        self::assertSame(StatusCode::STATUS_OK, $response->getStatusCode());

        // Devolvemos la operación para obligar al test PUT a ejecutarse DESPUÉS de este
        return $operacion;
    }

    /**
     * Test PUT /operations/{operationId} 200 OK
     *
     * @param array<string, mixed> $operacion
     * @return array<string, mixed>
     */
    #[TestAttr\Depends('testGetOperation200Ok')] // <-- ¡Cambio clave! Ahora depende de GET
    public function testPutOperation200Ok(array $operacion): array
    {
        $idStr = $operacion['operacionId'] ?? $operacion['id'];
        
        $p_data = [
            'estado' => 'RETRASADO' // Asegúrate de que existe en EstadoOperacion
        ];

        $response = $this->runApp(
            'PUT',
            self::RUTA_API . '/' . $idStr,
            $p_data,
            self::$gestor['authHeader']
        );
        
        self::assertSame(StatusCode::STATUS_OK, $response->getStatusCode());
        
        $r_body = $response->getBody()->getContents();
        return json_decode($r_body, true)['operacion'] ?? json_decode($r_body, true);
    }

    /**
     * Test OPTIONS /operations 204 NO CONTENT
     */
    public function testOptionsOperation204NoContent(): void
    {
        $response = $this->runApp(
            'OPTIONS',
            self::RUTA_API
        );
        self::assertSame(StatusCode::STATUS_NO_CONTENT, $response->getStatusCode());
        self::assertNotEmpty($response->getHeader('Allow'));
    }

    /**
     * Test DELETE /operations/{operationId} 204 NO CONTENT
     *
     * @param array<string, mixed> $operacion
     */
    #[TestAttr\Depends('testPutOperation200Ok')]
    public function testDeleteOperation204NoContent(array $operacion): void
    {
        $idStr = $operacion['operacionId'] ?? $operacion['id'];
        
        $response = $this->runApp(
            'DELETE',
            self::RUTA_API . '/' . $idStr,
            null,
            self::$gestor['authHeader']
        );
        self::assertSame(StatusCode::STATUS_NO_CONTENT, $response->getStatusCode());
    }
}