
from odoo import http
from odoo.http import request

class NFeImportController(http.Controller):
    @http.route('/web/nfe_import/upload', type='http', auth='user')
    def upload_nfe(self, **kwargs):
        return request.render('nfe_import.upload_form')
